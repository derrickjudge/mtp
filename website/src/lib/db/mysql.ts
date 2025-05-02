/**
 * MySQL Connection Utility
 * Provides a simple, reliable connection to MySQL database with connection pooling
 */

import mysql from 'mysql2/promise';

// Connection pool options
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'mtp_user',
  password: process.env.DB_PASSWORD || 'mtp_password',
  database: process.env.DB_NAME || 'mtp_photography',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Extract connection details from connection string if provided
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    poolConfig.host = url.hostname;
    poolConfig.port = parseInt(url.port || '3306', 10);
    poolConfig.user = url.username;
    poolConfig.password = url.password;
    poolConfig.database = url.pathname.substring(1); // Remove leading slash
  } catch (error) {
    console.warn('Invalid DATABASE_URL format, using default connection settings');
  }
}

// Create connection pool
const pool = mysql.createPool(poolConfig);

/**
 * Execute a database query with automatic connection handling
 * 
 * @param sql SQL query to execute
 * @param params Parameters for the query (for prepared statements)
 * @returns Promise with query results
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a database transaction with automatic connection handling
 * 
 * @param callback Transaction callback function
 * @returns Promise with transaction result
 */
export async function transaction<T>(callback: (connection: mysql.Connection) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Execute a query with retry logic for transient errors
 * 
 * @param queryFn Function that performs the query
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise with query results
 */
export async function withRetry<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable (connection related)
      const isRetryable = 
        error.code === 'ECONNRESET' || 
        error.code === 'PROTOCOL_CONNECTION_LOST' ||
        error.code === 'ER_LOCK_DEADLOCK';
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 100;
      console.warn(`Database error, retrying in ${delay}ms (${attempt + 1}/${maxRetries})`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Healthcheck function to verify database connection
 * 
 * @returns Promise that resolves if connection is healthy, rejects otherwise
 */
export async function healthcheck(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database healthcheck failed:', error);
    return false;
  }
}

// Ensure pool is closed when the process exits
process.on('exit', () => {
  pool.end().catch(console.error);
});

export default {
  query,
  transaction,
  withRetry,
  healthcheck,
  pool
};
