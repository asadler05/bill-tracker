document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bill-form");
  const table = document.getElementById("bill-table");
  const cards = document.getElementById("bill-cards");
  const themeToggle = document.getElementById("theme-toggle");
  const fab = document.getElementById("fab-add");
  const formContainer = document.getElementById("form-container");

  function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  fab.addEventListener("click", () => {
    formContainer.classList.toggle("open");
    if (formContainer.classList.contains("open")) {
      document.getElementById("bill-name").focus();
    }
  });

  let bills = JSON.parse(localStorage.getItem("bills")) || [];
  let theme = localStorage.getItem("theme") || "light";

  document.body.classList.toggle("dark", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";

  themeToggle.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    document.body.classList.toggle("dark", theme === "dark");
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    localStorage.setItem("theme", theme);
  });

  function saveBills() {
    localStorage.setItem("bills", JSON.stringify(bills));
  }

  function nextRecurringDate(due, type) {
    const d = new Date(due);
    if (type === "monthly") d.setMonth(d.getMonth() + 1);
    if (type === "quarterly") d.setMonth(d.getMonth() + 3);
    if (type === "yearly") d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  }

  function getDiffDays(due) {
    const today = new Date();
    const dueDate = new Date(due);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  }

  function renderBills() {
    table.innerHTML = "";
    cards.innerHTML = "";

    bills.forEach((bill, index) => {
      const diffDays = getDiffDays(bill.due);

      // TABLE ROW
      const row = document.createElement("tr");
      if (bill.paid) row.classList.add("paid");
      if (!bill.paid) {
        if (diffDays < 0) row.classList.add("overdue");
        else if (diffDays <= 3) row.classList.add("due-soon");
      }

      row.innerHTML = `
        <td>${bill.name}</td>
        <td class="editable amount-cell">$${bill.amount}</td>
        <td class="editable due-cell">${bill.due}</td>
        <td>${bill.recurring}</td>
        <td>${bill.link ? `<a href="${bill.link}" target="_blank">Pay</a>` : ""}</td>
        <td><input type="checkbox" ${bill.paid ? "checked" : ""}></td>
        <td><button class="delete-btn">X</button></td>
      `;

      // table paid toggle
      row.querySelector("input").addEventListener("change", () => {
        bill.paid = !bill.paid;
        if (bill.paid && bill.recurring !== "none") {
          bill.due = nextRecurringDate(bill.due, bill.recurring);
          bill.paid = false;
        }
        saveBills();
        renderBills();
      });

      // table delete
      row.querySelector(".delete-btn").addEventListener("click", () => {
        vibrate(20);
        bills.splice(index, 1);
        saveBills();
        renderBills();
      });

      // table amount inline edit
      row.querySelector(".amount-cell").addEventListener("click", () => {
        const cell = row.querySelector(".amount-cell");
        const input = document.createElement("input");
        input.type = "number";
        input.step = "0.01";
        input.value = bill.amount;
        input.className = "edit-input";
        cell.innerHTML = "";
        cell.appendChild(input);
        input.focus();
        const save = () => {
          const val = parseFloat(input.value || "0");
          bill.amount = isNaN(val) ? 0 : val;
          saveBills();
          renderBills();
        };
        input.addEventListener("blur", save);
        input.addEventListener("keydown", e => e.key === "Enter" && save());
      });

      // table due inline edit
      row.querySelector(".due-cell").addEventListener("click", () => {
        const cell = row.querySelector(".due-cell");
        const input = document.createElement("input");
        input.type = "date";
        input.value = bill.due;
        input.className = "edit-input";
        cell.innerHTML = "";
        cell.appendChild(input);
        input.focus();
        const save = () => {
          bill.due = input.value || bill.due;
          saveBills();
          renderBills();
        };
        input.addEventListener("blur", save);
        input.addEventListener("keydown", e => e.key === "Enter" && save());
      });

      table.appendChild(row);

      // CARD
      const card = document.createElement("div");
      card.className = "bill-card";
      card.dataset.name = bill.name;

      if (bill.paid) card.classList.add("paid");
      if (!bill.paid) {
        if (diffDays < 0) card.classList.add("overdue");
        else if (diffDays <= 3) card.classList.add("due-soon");
      }

      card.innerHTML = `
        <div class="card-content">
          <div class="drag-handle">≡</div>
          <div class="card-row"><strong>Bill:</strong> ${bill.name}</div>
          <div class="card-row editable amount-card"><strong>Amount:</strong> $${bill.amount}</div>
          <div class="card-row editable due-card"><strong>Due:</strong> ${bill.due}</div>
          <div class="card-row"><strong>Recurring:</strong> ${bill.recurring}</div>
          <div class="card-row">${bill.link ? `<a href="${bill.link}" target="_blank" class="pay-btn">Pay</a>` : ""}</div>
          <div class="card-row"><label><input type="checkbox" ${bill.paid ? "checked" : ""}> Paid</label></div>
        </div>
        <div class="swipe-delete">Delete</div>
      `;

      // card paid toggle
      card.querySelector("input").addEventListener("change", () => {
        bill.paid = !bill.paid;
        if (bill.paid && bill.recurring !== "none") {
          bill.due = nextRecurringDate(bill.due, bill.recurring);
          bill.paid = false;
        }
        saveBills();
        renderBills();
      });

      // card delete
      card.querySelector(".swipe-delete").addEventListener("click", () => {
        vibrate(20);
        bills.splice(index, 1);
        saveBills();
        renderBills();
      });

      // card amount inline edit
      card.querySelector(".amount-card").addEventListener("click", () => {
        const cell = card.querySelector(".amount-card");
        const input = document.createElement("input");
        input.type = "number";
        input.step = "0.01";
        input.value = bill.amount;
        input.className = "edit-input";
        cell.innerHTML = "<strong>Amount:</strong> ";
        cell.appendChild(input);
        input.focus();
        const save = () => {
          const val = parseFloat(input.value || "0");
          bill.amount = isNaN(val) ? 0 : val;
          saveBills();
          renderBills();
        };
        input.addEventListener("blur", save);
        input.addEventListener("keydown", e => e.key === "Enter" && save());
      });

      // card due inline edit
      card.querySelector(".due-card").addEventListener("click", () => {
        const cell = card.querySelector(".due-card");
        const input = document.createElement("input");
        input.type = "date";
        input.value = bill.due;
        input.className = "edit-input";
        cell.innerHTML = "<strong>Due:</strong> ";
        cell.appendChild(input);
        input.focus();
        const save = () => {
          bill.due = input.value || bill.due;
          saveBills();
          renderBills();
        };
        input.addEventListener("blur", save);
        input.addEventListener("keydown", e => e.key === "Enter" && save());
      });

      // SWIPE LOGIC
      let startX = 0;
      let swiping = false;

      card.addEventListener("touchstart", (e) => {
        if (e.target.closest(".swipe-delete") || e.target.closest(".drag-handle")) return;
        startX = e.touches[0].clientX;
        swiping = true;
      });

      card.addEventListener("touchmove", (e) => {
        if (!swiping) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX;

        if (diff < -40 && !card.classList.contains("swiped")) {
          card.classList.add("swiped");
          vibrate(10);
        }

        if (diff > 40 && card.classList.contains("swiped")) {
          card.classList.remove("swiped");
          vibrate(5);
        }
      });

      card.addEventListener("touchend", () => {
        swiping = false;
      });

      // TOUCH DRAG-TO-REORDER (via drag handle)
      const dragHandle = card.querySelector(".drag-handle");
      let touchStartY = 0;
      let dragging = false;
      let placeholder = null;

      dragHandle.addEventListener("touchstart", (e) => {
        e.stopPropagation();
        touchStartY = e.touches[0].clientY;
        dragging = true;

        placeholder = document.createElement("div");
        placeholder.className = "bill-card placeholder";
        placeholder.style.height = card.offsetHeight + "px";

        card.classList.add("dragging-touch");
        card.style.transition = "none";
        cards.insertBefore(placeholder, card.nextSibling);
      });

      dragHandle.addEventListener("touchmove", (e) => {
        if (!dragging) return;
        e.preventDefault();

        const y = e.touches[0].clientY;
        const dy = y - touchStartY;

        card.style.transform = `translateY(${dy}px)`;

        const cardList = [...cards.children].filter(c => c !== card && c !== placeholder);

        for (const other of cardList) {
          const rect = other.getBoundingClientRect();
          const mid = rect.top + rect.height / 2;

          if (y < mid) {
            cards.insertBefore(placeholder, other);
            break;
          } else {
            cards.appendChild(placeholder);
          }
        }
      });

      dragHandle.addEventListener("touchend", () => {
        if (!dragging) return;
        dragging = false;

        card.classList.remove("dragging-touch");
        card.style.transition = "";
        card.style.transform = "";

        cards.insertBefore(card, placeholder);
        placeholder.remove();
        placeholder = null;

        // Save new order
        const newOrder = [...cards.querySelectorAll(".bill-card")].map(c => {
          const name = c.dataset.name;
          return bills.find(b => b.name === name);
        });

        if (newOrder.length === bills.length) {
          bills = newOrder;
          saveBills();
        }
      });

      cards.appendChild(card);
    });
  }

  // FORM SUBMIT
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("bill-name").value.trim();
    const amountVal = document.getElementById("bill-amount").value;
    const amount = parseFloat(amountVal || "0");
    const due = document.getElementById("bill-due").value;
    const recurring = document.getElementById("bill-recurring").value;
    let link = document.getElementById("bill-link").value.trim();

    if (!name || !due) return;

    if (link && !link.startsWith("http://") && !link.startsWith("https://")) {
      link = "https://" + link;
    }

    bills.push({
      name,
      amount: isNaN(amount) ? 0 : amount,
      due,
      recurring,
      link,
      paid: false
    });

    saveBills();
    form.reset();
    formContainer.classList.remove("open");
    renderBills();
  });

  // INITIAL RENDER
  renderBills();

  // PWA SERVICE WORKER
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
});
