import { db } from './index';
import { repositories } from './repositories';

async function testDatabase() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await db.connect();
    console.log('✅ Database connected successfully');

    // Test health check
    console.log('\nTesting health check...');
    const isHealthy = await db.healthCheck();
    console.log(`✅ Health check: ${isHealthy ? 'passed' : 'failed'}`);

    // Test photo repository
    console.log('\nTesting photo repository...');

    // Create a test photo
    console.log('Creating test photo...');
    const testPhoto = await repositories.photo.create({
      title: 'Test Photo',
      description: 'A test photo for database testing',
      url: 'https://example.com/test.jpg',
      authorId: 'cmamqhxjx0000zvx5bpxzlsyu', // Admin user ID
      published: true,
    });
    console.log('✅ Test photo created:', testPhoto);

    // Find the created photo
    console.log('\nFinding created photo...');
    const foundPhoto = await repositories.photo.findById(testPhoto.id);
    console.log('✅ Found photo:', foundPhoto);

    // Update the photo
    console.log('\nUpdating photo...');
    const updatedPhoto = await repositories.photo.update(testPhoto.id, {
      title: 'Updated Test Photo',
      description: 'Updated description',
    });
    console.log('✅ Photo updated:', updatedPhoto);

    // Find published photos
    console.log('\nFinding published photos...');
    const publishedPhotos = await repositories.photo.findPublished({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    console.log('✅ Found published photos:', publishedPhotos);

    // Delete the test photo
    console.log('\nDeleting test photo...');
    await repositories.photo.delete(testPhoto.id);
    console.log('✅ Test photo deleted');

    // Test transaction
    console.log('\nTesting transaction...');
    await db.transaction(async (tx) => {
      const photoRepo = repositories.photo;
      const photo = await photoRepo.create({
        title: 'Transaction Test Photo',
        url: 'https://example.com/transaction-test.jpg',
        authorId: 'cmamqhxjx0000zvx5bpxzlsyu', // Admin user ID
      });
      await photoRepo.update(photo.id, {
        title: 'Updated Transaction Test Photo',
      });
      await photoRepo.delete(photo.id);
    });
    console.log('✅ Transaction completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Disconnect from database
    console.log('\nDisconnecting from database...');
    await db.disconnect();
    console.log('✅ Database disconnected');
  }
}

// Run the tests
testDatabase().catch(console.error); 