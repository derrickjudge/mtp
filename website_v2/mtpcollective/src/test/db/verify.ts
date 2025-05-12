import { PrismaClient } from '../../generated/prisma';

async function verifyDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Attempting to connect to database...');
    await prisma.$connect();
    console.log('Successfully connected to database');

    console.log('\nChecking database schema...');
    // Query each table to verify it exists and show its structure
    const tables = ['User', 'Photo', 'Article', 'Category', 'Tag'];
    
    for (const table of tables) {
      try {
        const result = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = ${table.toLowerCase()};
        `;
        console.log(`\nTable ${table} structure:`);
        console.log(result);
      } catch (error) {
        console.error(`Error checking table ${table}:`, error);
      }
    }
  } catch (error) {
    console.error('Database verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
