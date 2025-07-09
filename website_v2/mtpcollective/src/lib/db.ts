import { PrismaClient } from '@prisma/client';

// Get optimized connection string for serverless environments
function getConnectionString(): string {
  const baseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('Database URL not configured');
  }

  // For serverless environments, optimize the connection string
  const url = new URL(baseUrl);
  
  // Add connection parameters to prevent prepared statement conflicts
  url.searchParams.set('connection_limit', '1');
  url.searchParams.set('pool_timeout', '0');
  url.searchParams.set('prepared_statements', 'false');
  url.searchParams.set('statement_timeout', '30000');
  url.searchParams.set('query_timeout', '30000');
  
  // Generate a truly unique ID for each connection (timestamp + random)
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  url.searchParams.set('application_name', `mtp-${uniqueId}`);
  
  // Add schema parameter to ensure clean state
  url.searchParams.set('schema', 'public');

  return url.toString();
}

// Create a database client optimized for serverless with additional configuration
export function createServerlessClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: getConnectionString(), // Generate fresh connection string each time
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// Execute database operations with automatic cleanup and connection isolation
export async function withServerlessDB<T>(
  operation: (client: PrismaClient) => Promise<T>
): Promise<T> {
  const client = createServerlessClient();
  try {
    // Force a fresh connection by executing a simple query first
    await client.$queryRaw`SELECT 1`;
    
    const result = await operation(client);
    return result;
  } finally {
    try {
      await client.$disconnect();
    } catch (disconnectError) {
      console.warn('Error disconnecting client:', disconnectError);
    }
  }
}

// Retry mechanism for database operations with more aggressive error handling
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error = new Error('Operation failed');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on authentication errors
      if (error.message?.includes('Invalid credentials')) {
        throw error;
      }
      
      // For prepared statement errors, wait longer before retry
      if (error.code === '42P05' || error.message?.includes('prepared statement')) {
        console.warn(`Prepared statement conflict detected (attempt ${attempt}/${maxRetries}):`, error.message);
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait longer for prepared statement conflicts
        await new Promise(resolve => setTimeout(resolve, delay * attempt * 2));
        continue;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
} 