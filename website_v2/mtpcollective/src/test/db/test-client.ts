import { PrismaClient } from '../../generated/prisma';

// Create a singleton PrismaClient instance for tests
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_TEST_URL || process.env.POSTGRES_PRISMA_URL,
    },
  },
});
