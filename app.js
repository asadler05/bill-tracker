const form = document.getElementById("bill-form");
const table = document.getElementById("bill-table");

let bills = JSON.parse(localStorage.getItem("bills")) || [];

function saveBills() {
  localStorage.setItem("bills", JSON.stringify(bills));
}

function renderBills() {
  table.innerHTML = "";

  bills.sort((a, b) => new Date(a.due) - new Date(b.due));

  bills.forEach((bill, index) => {
    const row = document.createElement("tr");
    if (bill.paid) row.classList.add("paid");

    row.innerHTML = `
      <td>${bill.name}</td>
      <td>$${bill.amount}</td>
      <td>${bill.due}</td>
      <td><input type="checkbox" ${bill.paid ? "checked" : ""}></td>
      <td><button class="delete-btn">X</button></td>
    `;

    // Toggle paid
    row.querySelector("input").addEventListener("change", () => {
      bill.paid = !bill.paid;
      saveBills();
      renderBills();
    });

    // Delete bill
    row.querySelector("button").addEventListener("click", () => {
      bills.splice(index, 1);
      saveBills();
      renderBills();
    });

    table.appendChild(row);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("bill-name").value;
  const amount = document.getElementById("bill-amount").value;
  const due = document.getElementById("bill-due").value;

  bills.push({
    name,
    amount,
    due,
    paid: false
  });

  saveBills();
  renderBills();
  form.reset();
});

renderBills();
