/**
 * Database Client Utility
 * Provides robust connection to MySQL database using mysql2/promise
 * Features connection pooling, retries, and comprehensive error handling
 */

import mysql from 'mysql2/promise';

// Set up connection configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'mtp_user',
  password: process.env.DB_PASSWORD || 'mtp_password',
  database: process.env.DB_NAME || 'mtp_photography',
  // Connection pool settings
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10 seconds
  // Timeout settings
  connectTimeout: 10000, // 10 seconds
  // Fix SSL issues in some environments by making it optional
  ssl: process.env.DB_SSL === 'true' ? {} : undefined
};

// Create a connection pool for better performance
const pool = mysql.createPool(dbConfig);

// Max number of retry attempts for transient errors
const MAX_RETRIES = 3;

// List of error codes that are considered transient and can be retried
const RETRYABLE_ERROR_CODES = [
  'ECONNRESET',
  'ETIMEDOUT',
  'PROTOCOL_CONNECTION_LOST',
  'ER_LOCK_WAIT_TIMEOUT'
];

/**
 * Execute a health check query to verify database connection
 * @returns Promise<boolean> indicating if database is accessible
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Execute a query with parameters and retry logic for transient errors
 * @param sql The SQL query string
 * @param params Array of parameters to be bound to the query
 * @param retryCount Current retry attempt (used internally)
 * @returns Promise with query results
 */
export async function query(sql: string, params: any[] = [], retryCount = 0) {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    // Log query in development mode
    if (process.env.NODE_ENV === 'development') {
      const queryString = sql.replace(/\s+/g, ' ').trim();
      const paramsString = params.length > 0 ? ` with params: ${JSON.stringify(params)}` : '';
      console.debug(`[DB Query]${paramsString ? ' 🔍' : ''} ${queryString.substring(0, 100)}${queryString.length > 100 ? '...' : ''}${paramsString}`);
    }
    
    const [results] = await connection.query(sql, params);
    return results;
  } catch (error: any) {
    // Check if error is retryable and we haven't exceeded max retries
    if (retryCount < MAX_RETRIES && RETRYABLE_ERROR_CODES.includes(error.code)) {
      console.warn(`Retryable database error (${error.code}), attempt ${retryCount + 1}/${MAX_RETRIES}`);
      
      // Wait with exponential backoff before retrying
      const backoffMs = Math.pow(2, retryCount) * 100;
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      
      // Release connection and retry
      if (connection) connection.release();
      return query(sql, params, retryCount + 1);
    }
    
    // Log error details but don't expose sensitive info
    console.error(`Database query error (${error.code}):`, error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Execute a transaction with multiple queries and retry logic for transient errors
 * @param callback Function containing queries to execute within transaction
 * @param retryCount Current retry attempt (used internally)
 * @returns Promise with transaction results
 */
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>,
  retryCount = 0
): Promise<T> {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Log transaction in development mode
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DB Transaction] Started ${new Date().toISOString()}`);
    }
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error: any) {
    // Roll back transaction on error
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error during transaction rollback:', rollbackError);
      }
    }
    
    // Check if error is retryable and we haven't exceeded max retries
    if (retryCount < MAX_RETRIES && RETRYABLE_ERROR_CODES.includes(error.code)) {
      console.warn(`Retryable transaction error (${error.code}), attempt ${retryCount + 1}/${MAX_RETRIES}`);
      
      // Wait with exponential backoff before retrying
      const backoffMs = Math.pow(2, retryCount) * 100;
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      
      // Release connection and retry
      if (connection) connection.release();
      return transaction(callback, retryCount + 1);
    }
    
    // Log error details but don't expose sensitive info
    console.error(`Transaction error (${error.code || 'UNKNOWN'}):`, error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Export the database utilities
const db = {
  pool,
  query,
  transaction,
  checkDatabaseConnection
};

export default db;
