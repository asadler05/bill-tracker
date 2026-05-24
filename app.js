function renderBills() {
  table.innerHTML = "";

  bills.sort((a, b) => new Date(a.due) - new Date(b.due));

  bills.forEach((bill, index) => {
    const row = document.createElement("tr");
    if (bill.paid) row.classList.add("paid");

    row.innerHTML = `
      <td>${bill.name}</td>

      <td class="editable amount-cell">$${bill.amount}</td>

      <td class="editable due-cell">${bill.due}</td>

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

    // Editable due date
    const dueCell = row.querySelector(".due-cell");
    dueCell.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "date";
      input.value = bill.due;
      input.className = "edit-input";

      dueCell.innerHTML = "";
      dueCell.appendChild(input);
      input.focus();

      const save = () => {
        bill.due = input.value;
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
