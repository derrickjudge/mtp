const { Client } = require('pg');

async function markFeaturedPhotos() {
  const client = new Client({
    connectionString: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get all photos
    const result = await client.query('SELECT id, title FROM "Photo" WHERE published = true LIMIT 3');
    const photos = result.rows;

    console.log('Found photos:', photos.map(p => p.title));

    // Mark the first 2 photos as featured
    for (let i = 0; i < Math.min(2, photos.length); i++) {
      await client.query('UPDATE "Photo" SET featured = true WHERE id = $1', [photos[i].id]);
      console.log(`Marked "${photos[i].title}" as featured`);
    }

    console.log('Successfully marked photos as featured');
  } catch (error) {
    console.error('Error marking photos as featured:', error);
  } finally {
    await client.end();
  }
}

markFeaturedPhotos(); 