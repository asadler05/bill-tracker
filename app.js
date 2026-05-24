document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("bill-form");
  const table = document.getElementById("bill-table");
  const themeToggle = document.getElementById("theme-toggle");

  let bills = JSON.parse(localStorage.getItem("bills")) || [];
  let theme = localStorage.getItem("theme") || "light";

  // Apply saved theme
  document.body.classList.toggle("dark", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";

  function saveBills() {
    localStorage.setItem("bills", JSON.stringify(bills));
  }

  // Calculate next recurring due date
  function nextRecurringDate(due, type) {
    const d = new Date(due);

    if (type === "monthly") d.setMonth(d.getMonth() + 1);
    if (type === "quarterly") d.setMonth(d.getMonth() + 3);
    if (type === "yearly") d.setFullYear(d.getFullYear() + 1);

    return d.toISOString().split("T")[0];
  }

  function renderBills() {
    table.innerHTML = "";

    bills.sort((a, b) => new Date(a.due) - new Date(b.due));

    bills.forEach((bill, index) => {
      const row = document.createElement("tr");
      if (bill.paid) row.classList.add("paid");

      row.innerHTML = `
        <td>${bill.name}</td>

        <td class="editable amount-cell">$${bill.amount}</td>

        <td>${bill.due}</td>
        <td>${bill.category}</td>
        <td>${bill.recurring}</td>

        <td>
          ${bill.link ? `<a href="${bill.link}" target="_blank">Pay</a>` : ""}
        </td>

        <td><input type="checkbox" ${bill.paid ? "checked" : ""}></td>
        <td><button class="delete-btn">X</button></td>
      `;

      // Toggle paid
      row.querySelector("input").addEventListener("change", () => {
        bill.paid = !bill.paid;

        // Auto-advance recurring bills
        if (bill.paid && bill.recurring !== "none") {
          bill.due = nextRecurringDate(bill.due, bill.recurring);
          bill.paid = false;
        }

        saveBills();
        renderBills();
      });

      // Delete bill
      row.querySelector("button").addEventListener("click", () => {
        bills.splice(index, 1);
        saveBills();
        renderBills();
      });

      // Editable amount
      const amountCell = row.querySelector(".amount-cell");
      amountCell.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "number";
        input.value = bill.amount;
        input.className = "edit-input";

        amountCell.innerHTML = "";
        amountCell.appendChild(input);
        input.focus();

        const save = () => {
          bill.amount = input.value;
          saveBills();
          renderBills();
        };

        input.addEventListener("blur", save);
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") save();
        });
      });

      table.appendChild(row);
    });
  }

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
  });

  // Theme toggle
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
  });

  // Register service worker for PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }

  renderBills();

});
