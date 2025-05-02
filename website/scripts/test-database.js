/**
 * Database Integration Test
 * This script tests the database connection and basic operations
 */

require('dotenv').config({ path: '.env.local' });
const colors = require('colors/safe');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Read the database config from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'mtp_user',
  password: process.env.DB_PASSWORD || 'mtp_password',
  database: process.env.DB_NAME || 'mtp_photography',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Create utility functions similar to those in the database.ts module
const db = {
  async checkDatabaseConnection() {
    try {
      const connection = await pool.getConnection();
      await connection.query('SELECT 1');
      connection.release();
      return true;
    } catch (error) {
      console.error('Database connection check failed:', error.message);
      return false;
    }
  },
  
  async query(sql, params = []) {
    let connection;
    try {
      connection = await pool.getConnection();
      const [results] = await connection.query(sql, params);
      return results;
    } finally {
      if (connection) connection.release();
    }
  },
  
  async transaction(callback) {
    let connection;
    try {
      connection = await pool.getConnection();
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
  }
};

/**
 * Run database integration tests
 */
async function runDatabaseTests() {
  console.log(colors.yellow('=== Database Integration Tests ==='));
  
  // Track test results
  let passed = 0;
  let failed = 0;
  
  /**
   * Helper to run individual tests
   */
  async function runTest(name, testFn) {
    try {
      console.log(colors.cyan(`Running test: ${name}`));
      await testFn();
      console.log(colors.green(`✓ Passed: ${name}`));
      passed++;
    } catch (error) {
      console.error(colors.red(`✗ Failed: ${name}`));
      console.error(colors.red(`  Error: ${error.message}`));
      failed++;
    }
    console.log(); // Add spacing
  }
  
  // Test 1: Database Connection
  await runTest('Database Connection', async () => {
    const isConnected = await db.checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
  });
  
  // Test 2: Query Execution - Read Categories
  await runTest('Query Execution - Read Categories', async () => {
    const categories = await db.query('SELECT * FROM categories LIMIT 5');
    
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new Error('Failed to retrieve categories');
    }
    
    console.log(colors.gray(`  Retrieved ${categories.length} categories`));
    console.log(colors.gray(`  First category: ${JSON.stringify(categories[0])}`));
  });
  
  // Test 3: Query Execution with Parameters
  await runTest('Query Execution with Parameters', async () => {
    // Get a category ID to use for the test
    const categories = await db.query('SELECT id FROM categories LIMIT 1');
    const categoryId = categories[0]?.id;
    
    if (!categoryId) {
      throw new Error('No category ID found for test');
    }
    
    // Query with parameter
    const result = await db.query(
      'SELECT * FROM categories WHERE id = ?', 
      [categoryId]
    );
    
    if (!Array.isArray(result) || result.length !== 1 || result[0].id !== categoryId) {
      throw new Error('Failed to retrieve category by ID');
    }
    
    console.log(colors.gray(`  Retrieved category with ID ${categoryId}`));
  });
  
  // Test 4: Transaction - Success
  await runTest('Transaction - Success', async () => {
    // Use a transaction to get categories - this should succeed
    const categories = await db.transaction(async (connection) => {
      const [result] = await connection.query('SELECT * FROM categories LIMIT 2');
      return result;
    });
    
    if (!Array.isArray(categories) || categories.length !== 2) {
      throw new Error('Transaction failed to return expected results');
    }
    
    console.log(colors.gray(`  Transaction returned ${categories.length} categories`));
  });
  
  // Test 5: Transaction - Rollback
  await runTest('Transaction - Rollback', async () => {
    try {
      // This transaction should fail and rollback
      await db.transaction(async (connection) => {
        // First query works fine
        await connection.query('SELECT * FROM categories LIMIT 1');
        
        // This query will fail - table doesn't exist
        await connection.query('SELECT * FROM nonexistent_table');
        
        // We shouldn't reach here
        return true;
      });
      
      // If we get here, the test failed because the transaction didn't rollback
      throw new Error('Transaction did not rollback properly');
    } catch (error) {
      // This is expected - the transaction should fail and rollback
      if (error.message.includes('nonexistent_table')) {
        console.log(colors.gray('  Transaction properly rolled back after error'));
        return; // Test passed
      }
      
      // Unexpected error
      throw error;
    }
  });
  
  // Display results
  console.log(colors.yellow('=== Test Results ==='));
  console.log(colors.green(`Passed: ${passed}`));
  console.log(colors.red(`Failed: ${failed}`));
  console.log(colors.yellow(`Total: ${passed + failed}`));
  
  // Exit with success/failure code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runDatabaseTests().catch(error => {
  console.error(colors.red('Fatal error:', error));
  process.exit(1);
});
