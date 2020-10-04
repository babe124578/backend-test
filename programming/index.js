const express = require("express");
const bodyParser = require("body-parser");
const validate = require("express-jsonschema").validate;

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res
    .status(200)
    .set("Content-Type", "application/json")
    .send({ status: "success", data: {} });
});

const mariadb_adapter = require("./src/adapter/mariadb.js");
const formatter = require("./src/utility/formatter");
const validation = require("./src/utility/validation");

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

app.put(
  "/admin/exchanges/currency/",
  validate({
    body: validation.updateExchangeRate,
  }),
  async (req, res) => {
    let from = req.body.from;
    let to = req.body.to;
    let rate = req.body.rate;
    let isExists = await mariadb_adapter.basicQuery("rate", "exchanges", where);
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

app.put(
  "/customers/send/currency",
  validate({
    body: validation.updateTransferTransaction,
  }),
  async (req, res) => {
    const transaction_fail = () => {
      res
        .status(400)
        .set("Content-Type", "application/json")
        .send({
          status: "failure",
          data: { error: "Sorry, transaction failed." },
          status_code: 400,
        });
    };

    let sender_name = req.body.sender;
    let receiver_name = req.body.receiver;
    let sender_currency = req.body.sender_currency;
    let receiver_currency = req.body.receiver_currency;
    let amounts = req.body.amounts;

    let sender_money = await mariadb_adapter.basicQuery(
      "balances",
      "accounts",
      `name='${sender_name}' and crypto_name='${sender_currency}'`
    );
    let receiever_money = await mariadb_adapter.basicQuery(
      "balances",
      "accounts",
      `name='${receiver_name}' and crypto_name='${receiver_currency}'`
    );
    let sender_transaction;
    let receiver_transaction;
    let exchange_rate = 1;
    if (sender_currency !== receiver_currency) {
      exchange_rate = await mariadb_adapter.basicQuery(
        "rate",
        "exchanges",
        `from_currency='${sender_currency}' and to_currency='${receiver_currency}'`
      );
      if (exchange_rate.length === 0) {
        res
          .status(400)
          .set("Content-Type", "application/json")
          .send({
            status: "failure",
            data: {
              error: `Sorry, we can't exchange ${sender_currency} to ${receiver_currency} for now, please change.`,
            },
            status_code: 400,
          });
        return;
      } else {
        exchange_rate = exchange_rate[0].rate;
      }
    }

    if (sender_money.length === 0 || sender_money[0].balances - amounts < 0) {
      res
        .status(400)
        .set("Content-Type", "application/json")
        .send({
          status: "failure",
          data: { error: "Sorry, you don't have enough balances." },
          status_code: 400,
        });
      return;
    }
    if (receiever_money.length === 0) {
      await mariadb_adapter.transaction("START TRANSACTION");
      sender_transaction = await mariadb_adapter.updateField(
        `name='${sender_name}' and crypto_name='${sender_currency}'`,
        "balances",
        "accounts",
        `balances - ${amounts}`
      );
      if (sender_transaction.affectedRows === 1) {
        receiver_transaction = await mariadb_adapter.insertRow(
          `(name,crypto_name,balances)`,
          "accounts",
          `("${receiver_name}", "${receiver_currency}", ${
            amounts * exchange_rate
          })`
        );
        if (receiver_transaction.affectedRows === 1) {
          await mariadb_adapter.transaction("COMMIT");
        } else {
          await mariadb_adapter.transaction("ROLLBACK");
          transaction_fail();
        }
      } else {
        await mariadb_adapter.transaction("ROLLBACK");
        transaction_fail();
      }
    } else {
      await mariadb_adapter.transaction("START TRANSACTION");
      sender_transaction = await mariadb_adapter.updateField(
        `name='${sender_name}' and crypto_name='${sender_currency}'`,
        "balances",
        "accounts",
        `balances - ${amounts}`
      );
      if (sender_transaction.affectedRows === 1) {
        receiver_transaction = await mariadb_adapter.updateField(
          `name='${receiver_name}' and crypto_name='${receiver_currency}'`,
          "balances",
          "accounts",
          `balances + ${amounts * exchange_rate}`
        );
        if (receiver_transaction.affectedRows === 1) {
          await mariadb_adapter.transaction("COMMIT");
        } else {
          await mariadb_adapter.transaction("ROLLBACK");
          transaction_fail();
        }
      } else {
        await mariadb_adapter.transaction("ROLLBACK");
        transaction_fail();
      }
    }
    res.status(200).set("Content-Type", "application/json").send({
      status: "success",
      data: "Transfer money success",
      status_code: 200,
    });
  }
);

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
