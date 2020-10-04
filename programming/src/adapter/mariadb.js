/** Start init */

const mariadb = require("mariadb");

const pool = mariadb.createPool({
  host: "programming_databases_1",
  // host: "13.228.170.147",
  user: "root",
  password: "0000",
  connectionLimit: 5,
});
const database = "programming";

/** End init */

/** Start function */

const basicQuery = async (select, from, where) => {
  let query_script = `SELECT ${select} FROM ${from} WHERE ${where}`;
  const result = await _query(query_script);
  return result;
};

const sumWithGroupBy = async (group_by, sum_field, table) => {
  let query_script = `SELECT ${group_by}, SUM(${sum_field}) as ${sum_field} FROM ${table} GROUP BY ${group_by}`;
  const result = await _query(query_script);
  return result;
};

const sumWithSpecifiedField = async (sum_field, table, where) => {
  let query_script = `SELECT SUM(${sum_field}) as ${sum_field} FROM ${table} WHERE ${where}`;
  const result = await _query(query_script);
  return result;
};

const updateField = async (where, set, table, update_to) => {
  let query_script = `UPDATE ${table} SET ${set} = ${update_to} WHERE ${where}`;
  const result = await _query(query_script);
  return result;
};

const insertRow = async (table_headers, table, table_values) => {
  let query_script = `INSERT INTO ${table} ${table_headers} VALUES ${table_values}`;
  const result = await _query(query_script);
  return result;
};

const deleteQuery = async (table, where) => {
  let query_script = `DELETE FROM ${table} WHERE ${where}`;
  const result = await _query(query_script);
  return result;
};

const transaction = async (text) => {
  await _query(text);
};

const _query = async (query_script) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`use ${database}`);
    const query_result = await conn.query(query_script);
    return query_result;
  } catch (err) {
    return err;
  } finally {
    if (conn) conn.release();
  }
};

/** End function */

module.exports = {
  basicQuery,
  updateField,
  insertRow,
  deleteQuery,
  sumWithGroupBy,
  sumWithSpecifiedField,
  transaction,
};
