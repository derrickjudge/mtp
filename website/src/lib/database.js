/**
 * Database Client - JavaScript Compatibility Layer
 * This file provides a CommonJS wrapper around the TypeScript database module
 * to support imports via require() in tests and legacy code.
 */

// For test compatibility, instead of directly requiring the TS file, we'll export the same interface
// This avoids Jest having issues with TypeScript files
const mysql = require('mysql2/promise');

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mtp_db',
  connectionLimit: 10,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

/**
 * Execute a SQL query with parameters
 * @param {string} sql - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.query(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Execute a function within a transaction
 * @param {Function} callback - Function to execute within transaction
 * @returns {Promise<any>} Result of the callback function
 */
async function transaction(callback) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Execute the callback with the connection
    const result = await callback(connection);
    
    // If we got here, no errors were thrown, so commit
    await connection.commit();
    
    return result;
  } catch (error) {
    // If any error occurs, rollback the transaction
    if (connection) {
      await connection.rollback();
    }
    console.error('Transaction error:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Check if the database is accessible
 * @returns {Promise<boolean>} True if database is accessible
 */
async function checkDatabaseConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Close the database connection pool
 * @returns {Promise<boolean>} True if pool was closed successfully
 */
async function closePool() {
  try {
    await pool.end();
    return true;
  } catch (error) {
    console.error('Error closing database pool:', error);
    return false;
  }
}

// Export all database functions
module.exports = {
  pool,
  query,
  transaction,
  checkDatabaseConnection,
  closePool
};
