const fetch = require('node-fetch');

async function createCategoriesViaAPI() {
  try {
    console.log('🏷️  Creating categories via API...');

    const categories = [
      {
        name: 'Concerts',
        description: 'Live music and performance photography',
      },
      {
        name: 'Automotive',
        description: 'Car and motorsport photography',
      },
      {
        name: 'Nature',
        description: 'Landscape and wildlife photography',
      },
    ];

    // Note: This would need authentication in production
    // For now, we'll create them directly via production API
    const baseUrl = 'https://mtp-delta.vercel.app';

    console.log('📝 Categories to create:');
    categories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.description}`);
    });

    console.log('\n⚠️  Note: You need to create these categories manually through the admin interface');
    console.log('   or set up proper authentication for this script.');
    console.log('\n🌐 Go to: https://mtp-delta.vercel.app/admin/photos');
    console.log('   and create the categories through the UI for now.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createCategoriesViaAPI(); 