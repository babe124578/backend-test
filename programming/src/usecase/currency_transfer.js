const mariadb_adapter = require("../adapter/mariadb");

/**
 * Send currency from one customer to another one customer
 * Sender must have balance more than or equals to amount that want to send only.
 * If reciever have type of currency which sender send, system will update database.
 *    else system will insert new row to database.
 * If sender currency and receiver currency not the same type, the system will check exchange rate first.
 *
 */

const transfer = async (
  sender_name,
  receiver_name,
  sender_currency,
  receiver_currency,
  amounts
) => {
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

  let exchange_rate;
  if (sender_currency !== receiver_currency) {
    exchange_rate = await _calculateExchange(
      sender_currency,
      receiver_currency
    );
    if (exchange_rate === null) {
      return exchange_rate;
    }
  }

  if (sender_money.length === 0 || sender_money[0].balances - amounts < 0) {
    return _errorCreator("Sorry, you don't have enough balances.");
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
        return {
          status: "success",
          data: "Transfer money success",
          status_code: 200,
        };
      } else {
        await mariadb_adapter.transaction("ROLLBACK");
        return _errorCreator("Sorry, transaction failed 1.");
      }
    } else {
      await mariadb_adapter.transaction("ROLLBACK");
      return _errorCreator("Sorry, transaction failed 2.");
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
        return {
          status: "success",
          data: "Transfer money success",
          status_code: 200,
        };
      } else {
        await mariadb_adapter.transaction("ROLLBACK");
        return _errorCreator("Sorry, transaction failed 3.");
      }
    } else {
      await mariadb_adapter.transaction("ROLLBACK");
      return _errorCreator("Sorry, transaction failed 4.");
    }
  }
};

const _calculateExchange = async (sender_currency, receiver_currency) => {
  let exchange_rate = 1;
  exchange_rate = await mariadb_adapter.basicQuery(
    "rate",
    "exchanges",
    `from_currency='${sender_currency}' and to_currency='${receiver_currency}'`
  );
  if (exchange_rate.length === 0) {
    return _errorCreator(
      `Sorry, we can't exchange ${sender_currency} to ${receiver_currency} for now, please change.`
    );
  } else {
    exchange_rate = exchange_rate[0].rate;
  }
  return exchange_rate;
};

const _errorCreator = (errorText) => {
  return {
    status: "failure",
    data: { error: errorText },
    status_code: 400,
  };
};

module.exports = { transfer };
