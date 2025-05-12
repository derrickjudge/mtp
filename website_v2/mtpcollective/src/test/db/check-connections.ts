import { PrismaClient } from '../../generated/prisma';

async function checkConnections() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking active database connections...');
    const result = await prisma.$queryRawUnsafe(`
      SELECT * FROM pg_stat_activity 
      WHERE datname = current_database()
      AND pid <> pg_backend_pid();
    `);
    console.log('Active connections:', result);
  } catch (error) {
    console.error('Failed to check connections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnections();
