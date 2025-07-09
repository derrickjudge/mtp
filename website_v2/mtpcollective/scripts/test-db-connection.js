const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('Database URL configured:', !!process.env.POSTGRES_PRISMA_URL);
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if admin user exists
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
      
      // Test password verification
      if (adminUser.password) {
        const isValidPassword = await bcrypt.compare('admin123', adminUser.password);
        console.log('🔐 Password verification:', isValidPassword ? '✅ Valid' : '❌ Invalid');
      }
    } else {
      console.log('❌ Admin user not found');
      
      // Create admin user
      console.log('🔧 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@mtpcollective.com',
          name: 'Admin User',
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      
      console.log('✅ Admin user created:', {
        id: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role
      });
    }
    
    // Check categories
    const categories = await prisma.category.findMany();
    console.log('📁 Categories in database:', categories.length);
    
    // Check photos
    const photos = await prisma.photo.findMany();
    console.log('📸 Photos in database:', photos.length);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection(); 