import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL,
      },
    },
  });
};

// Prevent multiple instances of Prisma Client in development
export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Handle cleanup in serverless environment
if (process.env.NODE_ENV === 'production') {
  // Add event listener for cleanup
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

// Add a function to handle Prisma errors
export const handlePrismaError = async <T>(operation: () => Promise<T>): Promise<T> => {
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