const express = require("express");
const bodyParser = require("body-parser");
const validate = require("express-jsonschema").validate;
const mariadb_adapter = require("./src/adapter/mariadb.js");
const formatter = require("./src/utility/formatter");
const exists = require("./src/utility/exists");

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res
    .status(200)
    .set("Content-Type", "application/json")
    .send({ status: "success", data: {} });
});

app.get("/admin/balances/", async (req, res) => {
  let data;
  if (req.query.currency === undefined) {
    data = await mariadb_adapter.sumWithGroupBy(
      "crypto_name",
      "balances",
      "accounts"
    );
  } else {
    let currency = req.query.currency;
    data = await mariadb_adapter.sumWithSpecifiedField(
      "crypto_name",
      "balances",
      "accounts",
      currency
    );
  }
  let formattedData = formatter.format(data);
  res
    .status(formattedData["status_code"])
    .set("Content-Type", "application/json")
    .send(formattedData);
});

app.put("/admin/balances/update", async (req, res) => {
  let amounts = req.body.amounts;
  let values = `balances + ${amounts}`;
  let name = req.body.name;
  let crypto_name = req.body.crypto_name;
  let query = `name='${name}' and crypto_name='${crypto_name}'`;
  let data = await mariadb_adapter.updateField(
    query,
    "balances",
    "accounts",
    values
  );
  let formattedData = formatter.formatUpdate(data);
  res
    .status(formattedData["status_code"])
    .set("Content-Type", "application/json")
    .send(formattedData);
});

app.post("/admin/currency/", async (req, res) => {
  let amounts = req.body.amounts;
  let name = req.body.name;
  let crypto_name = req.body.crypto_name;
  let field = `(name,crypto_name,balances)`;
  let values = `("${name}", "${crypto_name}", ${amounts})`;
  let data = await mariadb_adapter.insertField(field, "accounts", values);
  let formattedData = formatter.formatInsert(data);
  res
    .status(formattedData["status_code"])
    .set("Content-Type", "application/json")
    .send(formattedData);
});

app.put("/admin/exchanges/currency/", async (req, res) => {
  let from = req.body.from;
  let to = req.body.to;
  let rate = req.body.rate;
  let exists_query = `from_currency='${from}' and to_currency='${to}'`;
  let isExists = await mariadb_adapter.basicQuery(
    "rate",
    "exchanges",
    exists_query
  );
  let data;
  let formattedData;
  if (isExists.length === 0) {
    let field = "(from_currency,to_currency,rate)";
    let values = `("${from}", "${to}", ${rate})`;
    data = mariadb_adapter.insertField(field, "exchanges", values);
    formattedData = formatter.formatInsert(data);
  } else {
    let query = `from_currency='${from}' and to_currency='${to}'`;
    data = mariadb_adapter.updateField(query, "rate", "exchanges", rate);
    formattedData = formatter.formatUpdate(data);
  }

  res
    .status(formattedData["status_code"])
    .set("Content-Type", "application/json")
    .send(formattedData);
});

app.put("/customers/send/currency", async (req, res) => {});

app.delete("/admin/currency/", async (req, res) => {
  let name = req.body.name;
  let crypto_name = req.body.crypto_name;
  let query = `name='${name}' AND crypto_name='${crypto_name}'`;
  let data = await mariadb_adapter.deleteQuery("accounts", query);
  let formattedData = formatter.formatUpdate(data);
  res
    .status(formattedData["status_code"])
    .set("Content-Type", "application/json")
    .send(formattedData);
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
