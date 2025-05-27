const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
console.log('Loading environment variables from:', envPath);
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function createCategories() {
  try {
    console.log('🏷️  Creating default categories...');

    const categories = [
      {
        name: 'Concerts',
        slug: 'concerts',
        description: 'Live music and performance photography',
      },
      {
        name: 'Automotive',
        slug: 'automotive',
        description: 'Car and motorsport photography',
      },
      {
        name: 'Nature',
        slug: 'nature',
        description: 'Landscape and wildlife photography',
      },
    ];

    for (const categoryData of categories) {
      // Check if category already exists
      const existingCategory = await prisma.category.findUnique({
        where: { name: categoryData.name },
      });

      if (existingCategory) {
        console.log(`✅ Category "${categoryData.name}" already exists`);
        continue;
      }

      // Create the category
      const category = await prisma.category.create({
        data: categoryData,
      });

      console.log(`✅ Created category: ${category.name} (${category.id})`);
    }

    console.log('🎉 Categories setup complete!');
    
    // List all categories
    const allCategories = await prisma.category.findMany();
    console.log('\n📋 Current categories:');
    allCategories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.description}`);
    });

  } catch (error) {
    console.error('❌ Error creating categories:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createCategories(); 