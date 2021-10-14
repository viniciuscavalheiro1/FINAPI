const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

//Meddleware
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Custumer not found." });
  }

  request.customer = customer;

  return next();
}

app.post("/account", (request, response) => {
  const { cpf, name, amount } = request.body;
  const id = uuidv4();

  const customersAlreadyExists = customers.some(
    (customer) => customers.cpf === cpf
  );

  if (customersAlreadyExists) {
    return response.status(400).json({ error: "Customer already Exists!" });
  }
  customers.push({
    cpf,
    name,
    id,
    amount,
    statement: [],
  });

  response.status(201).send();
});

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const amountAux = customers.amount;
  const statementOperation = {
    description,
    amount,
    created_at: new Date().toLocaleDateString(),
    type: "credit",
  };

  customer.amount += amount;
  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date);

  console.log(dateFormat);

  const statement = customer.statement.filter(
    (statement) => statement.created_at === date
  );

  return response.json(statement);
});

app.listen(3333, function () {
  console.log("Servidor rodadando na porta 3333");
});

app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json(customers);
});

app.post("/debit", verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;
  console.log(amount);
  console.log(customer.amount);
  console.log(customer.amount >= amount && customer.amount > 0);

  if (amount <= customer.amount && customer.amount >= 0) {
    const statementOperation = {
      description,
      amount,
      created_at: new Date().toLocaleDateString(),
      type: "debit",
    };

    customer.amount += amount;
    customer.statement.push(statementOperation);

    return response.status(201).send();
  }

  return response.status(400).json({ error: "Conta com saldo insuficiente" });
});

module.exports = app;
