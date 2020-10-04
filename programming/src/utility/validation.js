const updateBalance = {
  type: "object",
  properties: {
    amounts: {
      type: "number",
      required: true,
    },
    name: {
      type: "string",
      required: true,
    },
    crypto_name: {
      type: "string",
      required: true,
    },
  },
};

const addNewCurrency = {
  type: "object",
  properties: {
    amounts: {
      type: "number",
      required: true,
    },
    name: {
      type: "string",
      required: true,
    },
    crypto_name: {
      type: "string",
      required: true,
    },
  },
};

const updateExchangeRate = {
  type: "object",
  properties: {
    from: {
      type: "string",
      required: true,
    },
    to: {
      type: "string",
      required: true,
    },
    rate: {
      type: "number",
      required: true,
    },
  },
};

const updateTransferTransaction = {
  type: "object",
  properties: {
    sender: {
      type: "string",
      required: true,
    },
    receiver: {
      type: "string",
      required: true,
    },
    sender_currency: {
      type: "string",
      required: true,
    },
    receiver_currency: {
      type: "string",
      required: true,
    },
    amounts: {
      type: "number",
      required: true,
    },
  },
};

const deleteRow = {
  type: "object",
  properties: {
    name: {
      type: "string",
      required: true,
    },
    crypto_name: {
      type: "string",
      required: true,
    },
  },
};

module.exports = {
  updateBalance: updateBalance,
  addNewCurrency: addNewCurrency,
  updateExchangeRate: updateExchangeRate,
  updateTransferTransaction: updateTransferTransaction,
  deleteRow: deleteRow,
};
