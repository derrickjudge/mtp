import { PrismaClient } from '../../generated/prisma';

async function resetDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Attempting to reset database...');
    
    // Drop and recreate schema
    await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE;');
    await prisma.$executeRawUnsafe('CREATE SCHEMA public;');
    
    // Run schema creation
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "User_email_key" UNIQUE ("email")
      );
    `);
    
    console.log('Successfully reset database');
  } catch (error) {
    console.error('Failed to reset database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
