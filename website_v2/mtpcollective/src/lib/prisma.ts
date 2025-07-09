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

// Helper function to handle database operations with automatic reconnection
export const withPrisma = async <T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> => {
  try {
    const result = await operation(prisma);
    return result;
  } catch (error: any) {
    // Handle prepared statement errors in serverless environments
    if (error.code === '42P05' || error.message?.includes('prepared statement')) {
      console.warn('Prisma connection issue detected, reconnecting...');
      
      // Disconnect and create a fresh connection
      await prisma.$disconnect();
      const freshClient = createPrismaClient();
      
      try {
        const result = await operation(freshClient);
        await freshClient.$disconnect();
        return result;
      } catch (retryError) {
        await freshClient.$disconnect();
        throw retryError;
      }
    }
    
    throw error;
  }
}; 