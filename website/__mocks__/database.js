/**
 * Mock implementation of database module for testing
 */

const mysql = require('mysql2/promise');

// Get mocks from the mysql2/promise mock
const mockLib = jest.requireMock('mysql2/promise');
const { mockCalls, mockConnection } = mockLib;

// Export mocked functions that mirror our database.ts exports
const checkDatabaseConnection = jest.fn(async () => {
  try {
    await mockConnection.query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
});

const query = jest.fn(async (sql, params = []) => {
  let connection;
  try {
    connection = await mockLib.mockPool.getConnection();
    const [results] = await connection.query(sql, params);
    return results;
  } catch (error) {
    throw error;
  } finally {
    if (connection) connection.release();
  }
});

const transaction = jest.fn(async (callback) => {
  let connection;
  try {
    connection = await mockLib.mockPool.getConnection();
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
});

module.exports = {
  checkDatabaseConnection,
  query,
  transaction,
  default: {
    query,
    transaction,
  }
};
