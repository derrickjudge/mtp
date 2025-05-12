export const databaseConfig = {
  // Connection pool configuration
  poolConfig: {
    max: 20,
    min: 5,
    idle: 10000,
  },
  
  // Rate limiting configuration for database operations
  rateLimit: {
    window: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },
  
  // Query timeout configuration
  queryTimeout: 30000, // 30 seconds
  
  // Retry configuration for failed queries
  retry: {
    max: 3,
    backoff: {
      min: 1000, // 1 second
      max: 60000, // 60 seconds
      factor: 2,
    },
  },
};
