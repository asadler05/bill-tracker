document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("bill-form");
  const table = document.getElementById("bill-table");
  const cards = document.getElementById("bill-cards");
  const themeToggle = document.getElementById("theme-toggle");

  let bills = JSON.parse(localStorage.getItem("bills")) || [];
  let theme = localStorage.getItem("theme") || "light";

  document.body.classList.toggle("dark", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";

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

  function renderBills() {
    table.innerHTML = "";
    cards.innerHTML = "";

    bills.sort((a, b) => new Date(a.due) - new Date(b.due));

    bills.forEach((bill, index) => {

      /* ---------------- DESKTOP TABLE ---------------- */

      const row = document.createElement("tr");
      if (bill.paid) row.classList.add("paid");

      row.innerHTML = `
        <td>${bill.name}</td>
        <td class="editable amount-cell">$${bill.amount}</td>
        <td class="editable due-cell">${bill.due}</td>
        <td>${bill.category}</td>
        <td>${bill.recurring}</td>
        <td>${bill.link ? `<a href="${bill.link}" target="_blank">Pay</a>` : ""}</td>
        <td><input type="checkbox" ${bill.paid ? "checked" : ""}></td>
        <td><button class="delete-btn">X</button></td>
      `;

      /* TABLE EVENTS */
      row.querySelector("input").addEventListener("change", () => {
        bill.paid = !bill.paid;
        if (bill.paid && bill.recurring !== "none") {
          bill.due = nextRecurringDate(bill.due, bill.recurring);
          bill.paid = false;
        }
        saveBills();
        renderBills();
      });

      row.querySelector(".delete-btn").addEventListener("click", () => {
        bills.splice(index, 1);
        saveBills();
        renderBills();
      });

      /* Editable amount */
      row.querySelector(".amount-cell").addEventListener("click", () => {
        const cell = row.querySelector(".amount-cell");
        const input = document.createElement("input");
        input.type = "number";
        input.value = bill.amount;
        input.className = "edit-input";
        cell.innerHTML = "";
        cell.appendChild(input);
        input.focus();
        const save = () => {
          bill.amount = input.value;
          saveBills();
          renderBills();
        };
        input.addEventListener("blur", save);
        input.addEventListener("keydown", e => e.key === "Enter" && save());
      });

      /* Editable due date */
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
          bill.due = input.value;
          saveBills();
          renderBills();
        };
        input.addEventListener("blur", save);
        input.addEventListener("keydown", e => e.key === "Enter" && save());
      });

      table.appendChild(row);

      /* ---------------- MOBILE CARD ---------------- */

      const card = document.createElement("div");
      card.className = "bill-card";
      if (bill.paid) card.classList.add("paid");

      card.innerHTML = `
        <div class="card-row"><strong>Bill:</strong> ${bill.name}</div>
        <div class="card-row editable amount-card"><strong>Amount:</strong> $${bill.amount}</div>
        <div class="card-row editable due-card"><strong>Due:</strong> ${bill.due}</div>
        <div class="card-row"><strong>Category:</strong> ${bill.category}</div>
        <div class="card-row"><strong>Recurring:</strong> ${bill.recurring}</div>
        <div class="card-row">${bill.link ? `<a href="${bill.link}" target="_blank" class="pay-btn">Pay</a>` : ""}</div>
        <div class="card-row"><label><input type="checkbox" ${bill.paid ? "checked" : ""}> Paid</label></div>
        <button class="delete-btn">Delete</button>
      `;

      /* CARD EVENTS */
      card.querySelector("input").addEventListener("change", () => {
        bill.paid = !bill.paid;
        if (bill.paid && bill.recurring !== "none") {
          bill.due = nextRecurringDate(bill.due, bill.recurring);
          bill.paid = false;
        }
        saveBills();
        renderBills();
      });

      card.querySelector(".delete-btn").addEventListener("click", () => {
        bills.splice(index, 1);
        saveBills();
        renderBills();
      });

      /* Editable amount (card) */
      card.querySelector(".amount-card").addEventListener("click", () => {
        const cell = card.querySelector(".amount-card");
        const input = document.createElement("input");
        input.type = "number";
        input.value = bill.amount;
        input.className = "edit-input";
        cell.innerHTML = "<strong>Amount:</strong> ";
        cell.appendChild(input);
        input.focus();
        const save = () => {
          bill.amount = input.value;
          saveBills();
          renderBills();
        };
        input.addEventListener("blur", save);
        input.addEventListener("keydown", e => e.key === "Enter" && save());
      });

      /* Editable due date (card) */
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
          bill.due = input.value;
          saveBills();
          renderBills();
        };
        input.addEventListener("blur", save);
        input.addEventListener("keydown", e => e.key === "Enter" && save());
      });

      cards.appendChild(card);
    });

    /* ---------------- SWIPE TO DELETE (MOBILE) ---------------- */

    let startX = 0;
    let currentX = 0;
    let swiping = false;

    card.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      swiping = true;
    });

    card.addEventListener("touchmove", (e) => {
      if (!swiping) return;

      currentX = e.touches[0].clientX;
      const diff = currentX - startX;

      if (diff < -30) {
        card.classList.add("swiped");
      }
      if (diff > 30) {
        card.classList.remove("swiped");
      }
    });

    card.addEventListener("touchend", () => {
      swiping = false;
    });

  }
  const fab = document.getElementById("fab-add");
  const formContainer = document.getElementById("form-container");

  fab.addEventListener("click", () => {
    formContainer.classList.toggle("open");

    if (formContainer.classList.contains("open")) {
      document.getElementById("bill-name").focus();
    }
  });


  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const bill = {
      name: document.getElementById("bill-name").value,
      amount: document.getElementById("bill-amount").value,
      due: document.getElementById("bill-due").value,
      category: document.getElementById("bill-category").value,
      recurring: document.getElementById("bill-recurring").value,
      link: document.getElementById("bill-link").value,
      paid: false
    };

    bills.push(bill);
    saveBills();
    renderBills();
    form.reset();

    formContainer.classList.remove("open");

  });

  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }

  renderBills();

});
