import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Only create Prisma Client in production or when explicitly needed
const prismaClientSingleton = () => {
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.POSTGRES_PRISMA_URL,
        },
      },
    });
  }
  return undefined;
};

// Export a function to get the Prisma client
export const getPrismaClient = () => {
  if (process.env.NODE_ENV === 'production') {
    return globalThis.prisma ?? prismaClientSingleton();
  }
  return undefined;
};

// Initialize prisma only in production
if (process.env.NODE_ENV === 'production') {
  globalThis.prisma = prismaClientSingleton();
}

// Handle cleanup in serverless environment
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    if (globalThis.prisma) {
      await globalThis.prisma.$disconnect();
    }
  });
}

// Helper function to handle Prisma errors
export const handlePrismaError = async <T>(operation: () => Promise<T>): Promise<T> => {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error('Prisma client not available');
  }

  try {
    return await operation();
  } catch (error: any) {
    if (error.code === '42P05' && error.message.includes('prepared statement')) {
      // If we get a prepared statement error, disconnect and retry
      await prisma.$disconnect();
      return await operation();
    }
    throw error;
  }
}; 