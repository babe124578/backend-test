const express = require("express");
const bodyParser = require("body-parser");
const validate = require("express-jsonschema").validate;
const mariadb_adapter = require("./src/adapter/mariadb.js");
const formatter = require("./src/utility/formatter");
const validation = require("./src/utility/validation");
const currency_transfer = require("./src/usecase/currency_transfer");

const app = express();
const port = 3000;

app.use(bodyParser.json());

/** Health check */
app.get("/", (req, res) => {
  res
    .status(200)
    .set("Content-Type", "application/json")
    .send({ status: "success", data: {} });
});

/**
 * Get each currency balance
 *  - If no currency as query param.
 * Get one currency balance from query param
 *  - If have currency as query param
 */
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
    let where = `crypto_name = '${currency}'`;
    data = await mariadb_adapter.sumWithSpecifiedField(
      "balances",
      "accounts",
      where
    );
  }
  let formattedData = formatter.format(data);
  res
    .status(formattedData["status_code"])
    .set("Content-Type", "application/json")
    .send(formattedData);
});

/**
 * Get exchange rate from query parameter
 * If no query param return error
 */
app.get("/admin/exchanges/", async (req, res) => {
  let from = req.query.from;
  let to = req.query.to;
  if (from === undefined || to === undefined) {
    res
      .status(400)
      .set("Content-Type", "application/json")
      .send({
        status: "failure",
        data: { error: "Please type from and to in query parameter" },
        status_code: 400,
      });
    return;
  }
  let data = await mariadb_adapter.basicQuery(
    "*",
    "exchanges",
    `from_currency='${from}' and to_currency='${to}'`
  );
  if (data.length === 0) {
    res
      .status(400)
      .set("Content-Type", "application/json")
      .send({
        status: "failure",
        data: {
          error: `Exchange rate from ${from} to ${to} not found`,
        },
        status_code: 400,
      });
    return;
  }
  let formattedData = formatter.format(data);
  res
    .status(formattedData["status_code"])
    .set("Content-Type", "application/json")
    .send(formattedData);
});

/**
 * Get balances from one customer
 */
app.get("/customer/balances/", async (req, res) => {
  let name = req.query.name;
  let crypto_name = req.query.crypto_name;
  if (name === undefined || crypto_name === undefined) {
    res
      .status(400)
      .set("Content-Type", "application/json")
      .send({
        status: "failure",
        data: { error: "No name or crypto_name in query parameter" },
        status_code: 400,
      });
    return;
  }
  let data = await mariadb_adapter.basicQuery(
    "balances",
    "accounts",
    `name='${name}' and crypto_name='${crypto_name}'`
  );
  if (data.length === 0) {
    res
      .status(400)
      .set("Content-Type", "application/json")
      .send({
        status: "failure",
        data: {
          error: `User not found or this user don't have ${crypto_name}`,
        },
        status_code: 400,
      });
    return;
  }
  let formattedData = formatter.format(data);
  res
    .status(formattedData["status_code"])
    .set("Content-Type", "application/json")
    .send(formattedData);
});

/**
 * Add new currency to a user.
 */
app.post(
  "/admin/currency/",
  validate({
    body: validation.addNewCurrency,
  }),
  async (req, res) => {
    let amounts = req.body.amounts;
    let name = req.body.name;
    let crypto_name = req.body.crypto_name;
    let table_headers = `(name,crypto_name,balances)`;
    let table_values = `("${name}", "${crypto_name}", ${amounts})`;
    let data = await mariadb_adapter.insertRow(
      table_headers,
      "accounts",
      table_values
    );
    let formattedData = formatter.formatInsert(data);
    res
      .status(formattedData["status_code"])
      .set("Content-Type", "application/json")
      .send(formattedData);
  }
);

/**
 * Update balance to user with crypto_name(currency_name) from input
 * Can both increment and increment
 */
app.put(
  "/admin/balances/update",
  validate({
    body: validation.updateBalance,
  }),
  async (req, res) => {
    let amounts = req.body.amounts;
    let update_to = `balances + ${amounts}`;
    let name = req.body.name;
    let crypto_name = req.body.crypto_name;
    let where = `name='${name}' and crypto_name='${crypto_name}'`;
    let data = await mariadb_adapter.updateField(
      where,
      "balances",
      "accounts",
      update_to
    );
    let formattedData = formatter.formatUpdate(data);
    res
      .status(formattedData["status_code"])
      .set("Content-Type", "application/json")
      .send(formattedData);
  }
);

/**
 * Update exchange rate from pair of currency (from, to)
 * If found use update
 * If not found use insert
 */
app.put(
  "/admin/exchanges/currency/",
  validate({
    body: validation.updateExchangeRate,
  }),
  async (req, res) => {
    let from = req.body.from;
    let to = req.body.to;
    let rate = req.body.rate;
    let isExists = await mariadb_adapter.basicQuery("rate", "exchanges", rate);
    let data;
    let formattedData;
    if (isExists.length === 0) {
      let table_headers = "(from_currency,to_currency,rate)";
      let table_values = `("${from}", "${to}", ${rate})`;
      data = mariadb_adapter.insertRow(
        table_headers,
        "exchanges",
        table_values
      );
      formattedData = formatter.formatInsert(data);
    } else {
      let where = `from_currency='${from}' and to_currency='${to}'`;
      data = mariadb_adapter.updateField(where, "rate", "exchanges", rate);
      formattedData = formatter.formatUpdate(data);
    }

    res
      .status(formattedData["status_code"])
      .set("Content-Type", "application/json")
      .send(formattedData);
  }
);

/**
 * Send currency from one customer to another one customer
 * Sender must have balance more than or equals to amount that want to send only.
 * If reciever have type of currency which sender send, system will update database.
 *    else system will insert new row to database.
 * If sender currency and receiver currency not the same type, the system will check exchange rate first.
 *
 */
app.put(
  "/customers/send/currency",
  validate({
    body: validation.updateTransferTransaction,
  }),
  async (req, res) => {
    let sender_name = req.body.sender;
    let receiver_name = req.body.receiver;
    let sender_currency = req.body.sender_currency;
    let receiver_currency = req.body.receiver_currency;
    let amounts = req.body.amounts;

    const data = await currency_transfer.transfer(
      sender_name,
      receiver_name,
      sender_currency,
      receiver_currency,
      amounts
    );
    res
      .status(data.status_code)
      .set("Content-Type", "application/json")
      .send(data);
  }
);

/**
 * Delete accounts row WHERE name and crypto_name(currency_name) equal to input provided in body.
 */
app.delete(
  "/admin/currency/",
  validate({
    body: validation.deleteRow,
  }),
  async (req, res) => {
    let name = req.body.name;
    let crypto_name = req.body.crypto_name;
    let where = `name='${name}' AND crypto_name='${crypto_name}'`;
    let data = await mariadb_adapter.deleteQuery("accounts", where);
    let formattedData = formatter.formatUpdate(data);
    res
      .status(formattedData["status_code"])
      .set("Content-Type", "application/json")
      .send(formattedData);
  }
);

app.use(function (err, req, res, next) {
  var responseData;

  if (err.name === "JsonSchemaValidation") {
    console.log(err.message);
    res.status(400);
    responseData = {
      statusText: "Bad Request",
      jsonSchemaValidation: true,
      validations: err.validations,
    };
    if (req.xhr || req.get("Content-Type") === "application/json") {
      res.json(responseData);
    } else {
      res.render("badrequestTemplate", responseData);
    }
  } else {
    next(err);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
