import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkConnection() {
  console.log('Checking environment variables...');
  console.log('POSTGRES_PRISMA_URL exists:', !!process.env.POSTGRES_PRISMA_URL);
  console.log('POSTGRES_URL_NON_POOLING exists:', !!process.env.POSTGRES_URL_NON_POOLING);

  try {
    const prisma = new PrismaClient();
    console.log('Attempting to connect to database...');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Connection successful!', result);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

checkConnection(); 