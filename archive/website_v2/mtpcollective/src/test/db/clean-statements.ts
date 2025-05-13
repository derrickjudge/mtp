import { PrismaClient } from '../../generated/prisma';

async function cleanPreparedStatements() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Attempting to deallocate prepared statements...');
    await prisma.$executeRawUnsafe('DEALLOCATE ALL');
    console.log('Successfully deallocated all prepared statements');
  } catch (error) {
    console.error('Failed to deallocate statements:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanPreparedStatements();
