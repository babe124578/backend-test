const maria_adapter = require("../adapter/mariadb");

/** Format get operation */
const format = (payload) => {
  if ("code" in payload) {
    return {
      status: "failure",
      data: { error: payload["code"] },
      status_code: 403,
    };
  } else {
    return { status: "success", data: payload, status_code: 200 };
  }
};

/** Format update operation */
const formatUpdate = (payload) => {
  if (payload["affectedRows"] === 0) {
    return {
      status: "warning",
      data: "No user or this user doesn't have this currency",
      status_code: 200,
    };
  } else {
    return { status: "success", data: "Update success", status_code: 200 };
  }
};

/** Format insert operation */
const formatInsert = (payload) => {
  if ("code" in payload) {
    return {
      status: "failure",
      data: { error: payload["code"] },
      status_code: 403,
    };
  } else {
    return { status: "success", data: "Update success", status_code: 200 };
  }
};

module.exports = {
  format,
  formatUpdate,
  formatInsert,
};
