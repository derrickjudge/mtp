const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function clearAllPhotos() {
  const prisma = new PrismaClient();

  try {
    console.log('🔌 Connected to database via Prisma');

    // Get count of photos before deletion
    const photoCount = await prisma.photo.count();
    console.log(`📸 Found ${photoCount} photos to delete`);

    if (photoCount === 0) {
      console.log('✅ No photos to delete');
      return;
    }

    // Delete all photos (Prisma will handle cascade deletes for relationships)
    console.log('🗑️ Deleting all photos and their relationships...');
    const deleteResult = await prisma.photo.deleteMany();
    console.log(`✅ Deleted ${deleteResult.count} photos`);

    // Verify deletion
    const remainingPhotos = await prisma.photo.count();
    console.log(`📊 Remaining photos: ${remainingPhotos}`);

    console.log('🎉 Photo cleanup complete!');
    console.log('⚠️  Note: R2 storage files were not deleted - they will be overwritten by new uploads');

  } catch (error) {
    console.error('❌ Error during photo cleanup:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
clearAllPhotos().catch(console.error);
