const { PrismaClient } = require('@prisma/client');

async function testProductionDatabase() {
  console.log('🔍 Testing production database connection...');
  
  // Use production-like environment variables
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
      }
    }
  });

  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test admin user query
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@mtpcollective.com' }
    });

    if (adminUser) {
      console.log('✅ Admin user found:', {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        hasPassword: !!adminUser.password
      });
    } else {
      console.log('❌ Admin user not found');
    }

    // Test session functionality
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProductionDatabase(); 