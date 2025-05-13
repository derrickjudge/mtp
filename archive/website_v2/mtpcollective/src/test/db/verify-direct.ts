import { PrismaClient } from '../../generated/prisma';

async function verifyDirect() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_TEST_URL || process.env.POSTGRES_PRISMA_URL,
      },
    },
    // Disable query engine
    __internal: {
      useUds: false
    }
  });
  
  try {
    console.log('Attempting to connect directly...');
    await prisma.$connect();
    console.log('Successfully connected');

    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Query result:', result);
  } catch (error) {
    console.error('Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDirect();
