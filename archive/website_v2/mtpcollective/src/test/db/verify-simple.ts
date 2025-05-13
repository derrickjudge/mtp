import { PrismaClient } from '../../generated/prisma';

async function verifyDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Attempting to connect to database...');
    await prisma.$connect();
    console.log('Successfully connected to database');

    // Try to get a count of users as a simple test
    const userCount = await prisma.user.count();
    console.log('\nDatabase tables exist and are accessible:');
    console.log(`User table exists (${userCount} records)`);

    const photoCount = await prisma.photo.count();
    console.log(`Photo table exists (${photoCount} records)`);

    const articleCount = await prisma.article.count();
    console.log(`Article table exists (${articleCount} records)`);

  } catch (error) {
    console.error('Database verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
