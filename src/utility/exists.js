const maria_adapter = require("../adapter/mariadb");

const isExists = async (field, table, query) => {
  const result = await maria_adapter.basicQuery(field, table, query);
  console.log(result);
  return result;
};

module.exports = {
  isExists,
};
