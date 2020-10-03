/** Start init */

const mariadb = require("mariadb");

const pool = mariadb.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "0000",
  connectionLimit: 5,
});
const database = "programming";

/** End init */

/** Start function */

const basicQuery = async (field, table, query) => {
  query_script = `SELECT ${field} FROM ${table} WHERE ${query}`;
  const result = await _query(query_script, database);
  return result;
};

const sumWithGroupBy = async (group_by, sum_field, table) => {
  query_script = `SELECT ${group_by}, SUM(${sum_field}) as ${sum_field} FROM ${table} GROUP BY ${group_by}`;
  const result = await _query(query_script, database);
  return result;
};

const sumWithSpecifiedField = async (
  database,
  selected_field,
  sum_field,
  table,
  value
) => {
  query_script = `SELECT SUM(${sum_field}) as ${sum_field} FROM ${table} WHERE ${selected_field} = '${value}'`;
  const result = await _query(query_script, database);
  return result;
};

const updateField = async (query, field, table, amounts) => {
  query_script = `UPDATE ${table} SET ${field} = ${field} + ${amounts} WHERE ${query}`;
  const result = await _query(query_script, database);
  return result;
};

const insertField = async (field, table, values) => {
  query_script = `INSERT INTO ${table} ${field} VALUES ${values}`;
  const result = await _query(query_script, database);
  return result;
};

const deleteQuery = async (table, query) => {
  query_script = `DELETE FROM ${table} WHERE ${query}`;
  const result = await _query(query_script, database);
  return result;
};

const _query = async (query_script, database) => {
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
  insertField,
  deleteQuery,
  sumWithGroupBy,
  sumWithSpecifiedField,
};
