const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function clearAllPhotos() {
  const baseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('No database URL found in environment variables');
  }

  const client = new Client({
    connectionString: baseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('🔌 Connected to database');

    // Get count of photos before deletion
    const countResult = await client.query('SELECT COUNT(*) FROM "Photo"');
    const photoCount = parseInt(countResult.rows[0].count);
    console.log(`📸 Found ${photoCount} photos to delete`);

    if (photoCount === 0) {
      console.log('✅ No photos to delete');
      return;
    }

    // Delete photo relationships first
    console.log('🗑️ Deleting photo relationships...');
    await client.query('DELETE FROM "_CategoryToPhoto"');
    await client.query('DELETE FROM "_PhotoToTag"');
    await client.query('DELETE FROM "_EventPhotos"');

    // Delete all photos
    console.log('🗑️ Deleting all photos...');
    const deleteResult = await client.query('DELETE FROM "Photo"');
    console.log(`✅ Deleted ${deleteResult.rowCount} photos`);

    // Verify deletion
    const verifyResult = await client.query('SELECT COUNT(*) FROM "Photo"');
    const remainingPhotos = parseInt(verifyResult.rows[0].count);
    console.log(`📊 Remaining photos: ${remainingPhotos}`);

    console.log('🎉 Photo cleanup complete!');
    console.log('⚠️  Note: R2 storage files were not deleted - they will be overwritten by new uploads');

  } catch (error) {
    console.error('❌ Error during photo cleanup:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
clearAllPhotos().catch(console.error);
