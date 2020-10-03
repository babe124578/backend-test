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
      (group_by = "crypto_name"),
      (sum_field = "balances"),
      (table = "accounts")
    );
  } else {
    let currency = req.query.currency;
    data = await mariadb_adapter.sumWithSpecifiedField(
      (selected_field = "crypto_name"),
      (sum_field = "balances"),
      (table = "accounts"),
      (value = currency)
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
  let name = req.body.name;
  let crypto_name = req.body.crypto_name;
  let query = `name='${name}' and crypto_name='${crypto_name}'`;
  let data = await mariadb_adapter.updateField(
    (query = query),
    (field = "balances"),
    (table = "accounts"),
    (amounts = amounts)
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
  let data = await mariadb_adapter.insertField(
    (field = field),
    (table = "accounts"),
    (values = values)
  );
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
  let query = `from_currency='${from}' and to_currency='${to}'`;
  let isExists = await exists.isExists(
    (field = "rate"),
    (table = "exchanges"),
    (query = query)
  );

  result = isExists;

  console.log(result);
});

app.put("/customers/send/currency", async (req, res) => {});

app.delete("/admin/currency/", async (req, res) => {
  let name = req.body.name;
  let crypto_name = req.body.crypto_name;
  let query = `name='${name}' AND crypto_name='${crypto_name}'`;
  let data = await mariadb_adapter.deleteQuery(
    (table = "accounts"),
    (query = query)
  );
  let formattedData = formatter.formatUpdate(data);
  res
    .status(formattedData["status_code"])
    .set("Content-Type", "application/json")
    .send(formattedData);
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
