import { PrismaClient } from '@prisma/client';

// Cache for connection strings to avoid repeated parsing
const connectionCache = new Map<string, string>();

// Get optimized connection string for serverless environments
function getConnectionString(): string {
  const baseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('Database URL not configured');
  }

  if (connectionCache.has(baseUrl)) {
    return connectionCache.get(baseUrl)!;
  }

  // For serverless environments, optimize the connection string
  const url = new URL(baseUrl);
  
  // Add connection parameters to prevent prepared statement conflicts
  url.searchParams.set('connection_limit', '1');
  url.searchParams.set('pool_timeout', '0');
  url.searchParams.set('prepared_statements', 'false');
  
  // Add random suffix to make each connection unique
  const uniqueId = Math.random().toString(36).substring(2, 15);
  url.searchParams.set('application_name', `mtp-${uniqueId}`);

  const optimizedUrl = url.toString();
  connectionCache.set(baseUrl, optimizedUrl);
  
  return optimizedUrl;
}

// Create a database client optimized for serverless
export function createServerlessClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: getConnectionString(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// Execute database operations with automatic cleanup
export async function withServerlessDB<T>(
  operation: (client: PrismaClient) => Promise<T>
): Promise<T> {
  const client = createServerlessClient();
  try {
    const result = await operation(client);
    return result;
  } finally {
    await client.$disconnect();
  }
}

// Retry mechanism for database operations
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
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
} 