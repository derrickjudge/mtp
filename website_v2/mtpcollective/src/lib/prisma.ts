import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with proper serverless configuration
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
      },
    },
  });
};

// Use global variable to prevent multiple instances in development
export const prisma = global.prisma || createPrismaClient();

// In development, store the client globally to prevent hot reload issues
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Handle cleanup in serverless environment
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

// Helper function for serverless environments that creates isolated connections
export const withPrisma = async <T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> => {
  // In serverless environments, always create a fresh connection to avoid prepared statement conflicts
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const client = createPrismaClient();
    try {
      const result = await operation(client);
      return result;
    } finally {
      await client.$disconnect();
    }
  }
  
  // In development, use the global client with error handling
  let client = prisma;
  let shouldDisconnect = false;

  try {
    const result = await operation(client);
    return result;
  } catch (error: any) {
    // Handle prepared statement errors and other connection issues
    if (
      error.code === '42P05' || 
      error.message?.includes('prepared statement') ||
      error.message?.includes('Connection terminated') ||
      error.message?.includes('Connection closed')
    ) {
      console.warn('Prisma connection issue detected, creating fresh connection...', error.message);
      
      // Create a completely fresh connection
      client = createPrismaClient();
      shouldDisconnect = true;
      
      try {
        const result = await operation(client);
        return result;
      } catch (retryError) {
        console.error('Retry operation failed:', retryError);
        throw retryError;
      }
    }
    
    throw error;
  } finally {
    // Clean up the fresh connection if we created one
    if (shouldDisconnect) {
      try {
        await client.$disconnect();
      } catch (disconnectError) {
        console.warn('Error disconnecting fresh client:', disconnectError);
      }
    }
  }
}; 