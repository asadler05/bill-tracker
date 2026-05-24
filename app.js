// ===============================
// Utility helpers
// ===============================

// Shorten URL for display
function displayLink(url) {
  if (!url) return "Add link";
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "");
  } catch {
    return "Open";
  }
}

// Soft haptic feedback
function vibrate(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

function formatDateMDY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const y = d.getFullYear();

  return `${m}-${day}-${y}`; // MM-DD-YYYY
}


// ===============================
// Load + Save
// ===============================
let bills = JSON.parse(localStorage.getItem("bills") || "[]");

function saveBills() {
  localStorage.setItem("bills", JSON.stringify(bills));
}

// ===============================
// DOM references
// ===============================
const form = document.getElementById("bill-form");
const formContainer = document.getElementById("form-container");
const table = document.getElementById("bill-table-body");
const cards = document.getElementById("bill-cards");
const addBtn = document.getElementById("add-btn");
const cancelAdd = document.getElementById("cancel-add");

// ===============================
// Add Bill Form
// ===============================
addBtn.addEventListener("click", () => {
  formContainer.classList.add("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

cancelAdd.addEventListener("click", () => {
  form.reset();
  formContainer.classList.remove("open");
});

form.addEventListener("submit", e => {
  e.preventDefault();

  const name = form.name.value.trim();
  const amount = form.amount.value.trim();
  const due = form.due.value;
  const recurring = form.recurring.value; // dropdown
  let link = form.link.value.trim();

  if (link && !link.startsWith("http://") && !link.startsWith("https://")) {
    link = "https://" + link;
  }

  bills.push({ name, amount, due, recurring, link });
  saveBills();
  form.reset();
  formContainer.classList.remove("open");
  vibrate(20);
  renderBills();
});

// ===============================
// Drag Reorder
// ===============================
let dragIndex = null;

cards.addEventListener("dragstart", e => {
  dragIndex = Number(e.target.dataset.index);
  e.dataTransfer.effectAllowed = "move";
});

cards.addEventListener("dragover", e => {
  e.preventDefault();
});

cards.addEventListener("drop", e => {
  const dropIndex = Number(e.target.closest(".bill-card")?.dataset.index);
  if (dropIndex >= 0 && dragIndex !== null) {
    const moved = bills.splice(dragIndex, 1)[0];
    bills.splice(dropIndex, 0, moved);
    saveBills();
    renderBills();
  }
});

// ===============================
// Swipe to Delete
// ===============================
function enableSwipe(card, index) {
  let startX = 0;
  let currentX = 0;
  let dragging = false;

  const content = card.querySelector(".card-content");
  const deleteBtn = card.querySelector(".swipe-delete");

  card.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    dragging = true;
  });

  card.addEventListener("touchmove", e => {
    if (!dragging) return;
    currentX = e.touches[0].clientX - startX;

    if (currentX < 0) {
      content.style.transform = `translateX(${currentX}px)`;
    }
  });

  card.addEventListener("touchend", () => {
    dragging = false;

    if (currentX < -80) {
      content.style.transform = "translateX(-80px)";
    } else {
      content.style.transform = "translateX(0)";
    }

    currentX = 0;
  });

  deleteBtn.addEventListener("click", () => {
    bills.splice(index, 1);
    saveBills();
    renderBills();
  });
}

// ===============================
// RENDER
// ===============================
function renderBills() {
  // Normalize data
  bills = bills.map(b => ({
    name: b.name || "",
    amount: b.amount || "",
    due: b.due || "",
    recurring: b.recurring || "None",
    link: b.link || ""
  }));
  saveBills();

  // Clear UI
  table.innerHTML = "";
  cards.innerHTML = "";

  // Sort by due date
  bills.sort((a, b) => new Date(a.due) - new Date(b.due));

  bills.forEach((bill, index) => {
    // Status class
    let statusClass = "";
    if (bill.due) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(bill.due);
      dueDate.setHours(0, 0, 0, 0);

      const diff = (dueDate - today) / (1000 * 60 * 60 * 24);
      if (diff < 0) statusClass = "overdue";
      else if (diff <= 3) statusClass = "due-soon";
    }

    // ============================
    // TABLE ROW
    // ============================
    const row = document.createElement("tr");
    row.className = statusClass;

    row.innerHTML = `
      <td class="editable name-cell">${bill.name}</td>
      <td class="editable amount-cell">$${bill.amount}</td>
      <td class="editable due-cell">${bill.due}</td>
      <td>${bill.recurring}</td> <!-- NOT editable -->
      <td class="editable link-cell">
        ${bill.link ? `<a href="${bill.link}" target="_blank">${displayLink(bill.link)}</a>` : "Add link"}
      </td>
      <td><button class="delete-btn">Delete</button></td>
    `;

    // Inline editors (table)
    const makeEditor = (selector, type, saveFn) => {
      row.querySelector(selector).addEventListener("click", () => {
        const cell = row.querySelector(selector);
        const input = document.createElement("input");
        input.type = type;
        input.value = saveFn("get");
        input.className = "edit-input";
        cell.innerHTML = "";
        cell.appendChild(input);
        input.focus();

        const commit = () => {
          saveFn("set", input.value.trim());
          saveBills();
          renderBills();
        };

        input.addEventListener("blur", commit);
        input.addEventListener("keydown", e => e.key === "Enter" && commit());
      });
    };

    makeEditor(".name-cell", "text", (mode, val) => mode === "get" ? bill.name : bill.name = val);
    makeEditor(".amount-cell", "number", (mode, val) => mode === "get" ? bill.amount : bill.amount = val || "0");
    makeEditor(".due-cell", "date", (mode, val) => mode === "get" ? bill.due : bill.due = val);

    makeEditor(".link-cell", "text", (mode, val) => {
      if (mode === "get") return bill.link;
      if (val && !val.startsWith("http")) val = "https://" + val;
      bill.link = val;
    });

    row.querySelector(".delete-btn").addEventListener("click", () => {
      bills.splice(index, 1);
      saveBills();
      renderBills();
    });

    table.appendChild(row);

    // ============================
    // FINTECH CARD
    // ============================
    const card = document.createElement("div");
    card.className = "bill-card " + statusClass;
    card.dataset.index = index;

    card.innerHTML = `
      <div class="card-content">
        <div class="card-header">${bill.name}</div>

        <div class="card-grid">
          <div class="grid-item">
            <label>Amount</label>
            <div class="value amount-value">$${bill.amount}</div>
          </div>

          <div class="grid-item">
            <label>Due</label>
            <div class="value due-value">${formatDateMDY(bill.due)}</div>
          </div>

          <div class="grid-item">
            <label>Recurring</label>
            <div class="value recur-value">${bill.recurring}</div> <!-- NOT editable -->
          </div>

          <div class="grid-item">
            <label>Link</label>
            <div class="value link-value">${displayLink(bill.link)}</div>
          </div>
        </div>
      </div>

      <div class="swipe-delete">Delete</div>
    `;

    // Open link on tap (if not editing)
    const linkEl = card.querySelector(".link-value");
    linkEl.addEventListener("click", e => {
      if (linkEl.querySelector("input")) return;
      if (bill.link) {
        window.open(bill.link, "_blank");
        e.stopPropagation();
      }
    });

    // Inline editors (card)
    const cardEdit = (selector, type, saveFn) => {
      card.querySelector(selector).addEventListener("click", () => {
        const cell = card.querySelector(selector);
        const input = document.createElement("input");
        input.type = type;
        input.value = saveFn("get");
        input.className = "edit-input";
        cell.innerHTML = "";
        cell.appendChild(input);
        input.focus();

        const commit = () => {
          saveFn("set", input.value.trim());
          saveBills();
          renderBills();
        };

        input.addEventListener("blur", commit);
        input.addEventListener("keydown", e => e.key === "Enter" && commit());
      });
    };

    cardEdit(".amount-value", "number", (mode, val) => mode === "get" ? bill.amount : bill.amount = val || "0");
    cardEdit(".due-value", "date", (mode, val) => mode === "get" ? bill.due : bill.due = val);

    cardEdit(".link-value", "text", (mode, val) => {
      if (mode === "get") return bill.link;
      if (val && !val.startsWith("http")) val = "https://" + val;
      bill.link = val;
    });

    // Enable swipe
    enableSwipe(card, index);

    // Enable drag
    card.draggable = true;

    cards.appendChild(card);
  });
}

// Initial render
renderBills();
