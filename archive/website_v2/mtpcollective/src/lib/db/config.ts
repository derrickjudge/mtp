export const DB_CONFIG = {
  maxConnections: process.env.NODE_ENV === 'production' ? 10 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxRetries: 3,
  retryDelay: 1000,
};

export const DB_ERROR_CODES = {
  CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DISCONNECTION_ERROR: 'DB_DISCONNECTION_ERROR',
  TRANSACTION_ERROR: 'DB_TRANSACTION_ERROR',
  QUERY_ERROR: 'DB_QUERY_ERROR',
  MIGRATION_ERROR: 'DB_MIGRATION_ERROR',
} as const; 