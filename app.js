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

// Format date as MM-DD-YYYY
function formatDateMDY(dateStr) {
  if (!dateStr) return "";

  const [y, m, d] = dateStr.split("-");
  return `${m}-${d}-${y}`;
}


// Soft haptic feedback
function vibrate(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
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
  const recurring = form.recurring.value;
  let link = form.link.value.trim();

  if (link && !link.startsWith("http://") && !link.startsWith("https://")) {
    link = "https://" + link;
  }

  bills.push({ name, amount, due, recurring, link, paid: false });
  saveBills();
  form.reset();
  formContainer.classList.remove("open");
  vibrate(20);
  renderBills();
});

// ===============================
// Paid Toggle Logic
// ===============================
function togglePaid(bill) {
  bill.paid = !bill.paid;

  if (bill.paid && bill.due) {
    const d = new Date(bill.due);
    const recur = bill.recurring.toLowerCase();

    if (recur.includes("month")) {
      d.setMonth(d.getMonth() + 1);
    } else if (recur.includes("quarter")) {
      d.setMonth(d.getMonth() + 3);
    } else if (recur.includes("year")) {
      d.setFullYear(d.getFullYear() + 1);
    }

    bill.due = d.toISOString().split("T")[0];
  }

  saveBills();
  renderBills();
}


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
      if (currentX < -20) card.classList.add("swiped");
      else card.classList.remove("swiped");
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
    link: b.link || "",
    paid: b.paid || false
  }));
  saveBills();

  // Clear UI
  table.innerHTML = "";
  cards.innerHTML = "";

  // Sort by due date
  bills.sort((a, b) => new Date(a.due) - new Date(b.due));

  bills.forEach((bill, index) => {
    // ============================
    // TABLE ROW
    // ============================
    const row = document.createElement("tr");
    if (bill.paid) row.classList.add("paid-row");

    row.innerHTML = `
      <td class="editable name-cell">${bill.name}</td>
      <td class="editable amount-cell" data-prefix="$">${bill.amount}</td>
      <td class="editable due-cell">${bill.due}</td>
      <td>${bill.recurring}</td>
      <td class="editable link-cell">
        ${bill.link ? `<a href="${bill.link}" target="_blank">${displayLink(bill.link)}</a>` : "Add link"}
      </td>
      <td>
        <div class="paid-toggle">✅</div>
      </td>
      <td><button class="delete-btn">Delete</button></td>
    `;

    // Paid toggle
    row.querySelector(".paid-toggle").addEventListener("click", () => {
      togglePaid(bill);
    });

    // Inline editors (table)
    const makeEditor = (selector, type, saveFn) => {
      row.querySelector(selector).addEventListener("click", () => {
        const cell = row.querySelector(selector);
        const input = document.createElement("input");

        // iOS FIX: set type + inputmode BEFORE setting value or appending
        if (selector.includes("amount")) {
          input.setAttribute("type", "text");
          input.setAttribute("inputmode", "decimal");
          input.setAttribute("pattern", "[0-9]*\\.?[0-9]*");
        } else {
          input.type = type;
        }

        input.className = "edit-input";
        input.value = saveFn("get");

        cell.innerHTML = "";
        cell.appendChild(input);

        // iOS FIX: focus AFTER append
        setTimeout(() => input.focus(), 50);

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
    makeEditor(".amount-cell", "text", (mode, val) => mode === "get" ? bill.amount : bill.amount = val || "0");
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
    card.className = "bill-card";
    if (bill.paid) card.classList.add("paid");
    card.dataset.index = index;

    card.innerHTML = `
      <div class="card-content">
        <div class="card-header">${bill.name}</div>

        <div class="card-grid">
          <div class="grid-item">
            <label>Amount</label>
            <div class="value amount-value" data-prefix="$">${bill.amount}</div>
          </div>

          <div class="grid-item">
            <label>Due</label>
            <div class="value due-value">${formatDateMDY(bill.due)}</div>
          </div>

          <div class="grid-item">
            <label>Recurring</label>
            <div class="value recur-value">${bill.recurring}</div>
          </div>

          <div class="grid-item">
            <label>Link</label>
            <div class="value link-value">${displayLink(bill.link)}</div>
          </div>
        </div>
      </div>

      <div class="paid-toggle">✅</div>
      <div class="swipe-delete">Delete</div>
    `;

    const today = new Date();
    const dueDate = new Date(bill.due);

    if (!bill.paid) {
      if (dueDate < today) {
        card.classList.add("overdue");
      } else {
        const diff = (dueDate - today) / (1000 * 60 * 60 * 24);
        if (diff <= 3) card.classList.add("due-soon");
      }
    }


    // Paid toggle (card)
    card.querySelector(".paid-toggle").addEventListener("click", e => {
      e.stopPropagation();
      togglePaid(bill);
    });

    // Open link on tap
    const linkEl = card.querySelector(".link-value");
    linkEl.addEventListener("click", e => {
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

        // iOS FIX: set type + inputmode BEFORE setting value or appending
        if (selector.includes("amount")) {
          input.setAttribute("type", "text");
          input.setAttribute("inputmode", "decimal");
          input.setAttribute("pattern", "[0-9]*\\.?[0-9]*");
        } else {
          input.type = type;
        }

        input.className = "edit-input";
        input.value = saveFn("get");

        cell.innerHTML = "";
        cell.appendChild(input);

        // iOS FIX: focus AFTER append
        setTimeout(() => {
          input.focus();
          input.showPicker?.();
        }, 50);

        const commit = () => {
          saveFn("set", input.value.trim());
          saveBills();
          setTimeout(renderBills, 150); // allow picker to finish
        };

        input.addEventListener("blur", commit);
        input.addEventListener("keydown", e => e.key === "Enter" && commit());
      });
    };

    cardEdit(".amount-value", "text", (mode, val) => mode === "get" ? bill.amount : bill.amount = val || "0");
    cardEdit(".due-value", "date", (mode, val) => mode === "get" ? bill.due : bill.due = val);

    cardEdit(".link-value", "text", (mode, val) => {
      if (mode === "get") return bill.link;
      if (val && !val.startsWith("http")) val = "https://" + val;
      bill.link = val;
    });

    // Enable swipe
    enableSwipe(card, index);

    cards.appendChild(card);
  });
}

// Initial render
renderBills();

// ===============================
// Service Worker Update Checker
// ===============================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").then(reg => {
    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          document.getElementById("update-toast").classList.remove("hidden");
        }
      });
    });
  });

  document.getElementById("update-btn").addEventListener("click", () => {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg && reg.waiting) {
        reg.waiting.postMessage({ action: "skipWaiting" });
      }
    });
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}
