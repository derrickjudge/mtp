/**
 * Seed script to create parent categories and subcategories
 * Run with: npx tsx scripts/seed-categories.ts
 */

import { config } from 'dotenv';
import { Client } from 'pg';

// Load environment variables from .env.local
config({ path: '.env.local' });

const createClient = (): Client => {
  const baseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('Database URL not configured. Set POSTGRES_PRISMA_URL or DATABASE_URL');
  }

  const url = new URL(baseUrl);
  
  return new Client({
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    user: url.username,
    password: url.password,
    ssl: url.searchParams.get('sslmode') !== 'disable' ? { rejectUnauthorized: false } : false,
  });
};

interface CategoryData {
  name: string;
  slug: string;
  description: string;
  parentId?: string | null;
}

async function createCategory(client: Client, data: CategoryData): Promise<string | null> {
  // Check if category already exists
  const existing = await client.query(
    'SELECT id FROM "Category" WHERE name = $1 OR slug = $2',
    [data.name, data.slug]
  );
  
  if (existing.rows.length > 0) {
    console.log(`  ⏭️  Skipping "${data.name}" (already exists)`);
    return existing.rows[0].id;
  }

  const result = await client.query(
    `INSERT INTO "Category" (id, name, slug, description, "showInNav", "parentId", "createdAt", "updatedAt") 
     VALUES (gen_random_uuid(), $1, $2, $3, true, $4, NOW(), NOW()) 
     RETURNING id`,
    [data.name, data.slug, data.description, data.parentId || null]
  );
  
  console.log(`  ✅ Created "${data.name}"`);
  return result.rows[0]?.id || null;
}

async function getParentId(client: Client, name: string): Promise<string | null> {
  const result = await client.query(
    'SELECT id FROM "Category" WHERE name = $1 AND "parentId" IS NULL',
    [name]
  );
  return result.rows[0]?.id || null;
}

async function seed() {
  const client = createClient();
  
  try {
    await client.connect();
    console.log('🔗 Connected to database\n');

    // 1. Create Street parent category (Music, Sports, Automotive already exist)
    console.log('📁 Creating parent categories...');
    await createCategory(client, {
      name: 'Street',
      slug: 'street',
      description: 'Urban and street photography capturing the pulse of city life, candid moments, and architectural landscapes.',
    });

    // Get all parent IDs
    const musicId = await getParentId(client, 'Music');
    const sportsId = await getParentId(client, 'Sports');
    const streetId = await getParentId(client, 'Street');
    const automotiveId = await getParentId(client, 'Automotive');

    console.log('\n📂 Creating subcategories...\n');

    // Music subcategories
    if (musicId) {
      console.log('🎵 Music subcategories:');
      await createCategory(client, {
        name: 'Signature Shots',
        slug: 'music-signature-shots',
        description: 'Curated selection of the best music photography',
        parentId: musicId,
      });
      await createCategory(client, {
        name: 'Action Shots',
        slug: 'music-action-shots',
        description: 'High-energy moments captured on stage',
        parentId: musicId,
      });
      await createCategory(client, {
        name: 'Portraits & Personalities',
        slug: 'music-portraits-personalities',
        description: 'Artist portraits and personality shots',
        parentId: musicId,
      });
      await createCategory(client, {
        name: 'Crowd & Culture',
        slug: 'music-crowd-culture',
        description: 'The energy and culture of live music audiences',
        parentId: musicId,
      });
    }

    // Sports subcategories
    if (sportsId) {
      console.log('\n🏆 Sports subcategories:');
      await createCategory(client, {
        name: 'Signature Shots',
        slug: 'sports-signature-shots',
        description: 'Curated selection of the best sports photography',
        parentId: sportsId,
      });
      await createCategory(client, {
        name: 'Rugby',
        slug: 'sports-rugby',
        description: 'Rugby action and moments',
        parentId: sportsId,
      });
      await createCategory(client, {
        name: 'Football',
        slug: 'sports-football',
        description: 'Football action and highlights',
        parentId: sportsId,
      });
      await createCategory(client, {
        name: 'Basketball',
        slug: 'sports-basketball',
        description: 'Basketball action and moments',
        parentId: sportsId,
      });
    }

    // Street subcategories
    if (streetId) {
      console.log('\n🏙️ Street subcategories:');
      await createCategory(client, {
        name: 'Signature Shots',
        slug: 'street-signature-shots',
        description: 'Curated selection of the best street photography',
        parentId: streetId,
      });
      await createCategory(client, {
        name: 'Urban Landscapes',
        slug: 'street-urban-landscapes',
        description: 'Cityscapes and urban architecture',
        parentId: streetId,
      });
      await createCategory(client, {
        name: 'Candid Life',
        slug: 'street-candid-life',
        description: 'Candid moments of everyday life',
        parentId: streetId,
      });
    }

    // Automotive subcategories
    if (automotiveId) {
      console.log('\n🚗 Automotive subcategories:');
      await createCategory(client, {
        name: 'Signature Shots',
        slug: 'automotive-signature-shots',
        description: 'Curated selection of the best automotive photography',
        parentId: automotiveId,
      });
      await createCategory(client, {
        name: 'Imports',
        slug: 'automotive-imports',
        description: 'Import cars and JDM culture',
        parentId: automotiveId,
      });
      await createCategory(client, {
        name: 'Classics',
        slug: 'automotive-classics',
        description: 'Classic and vintage automobiles',
        parentId: automotiveId,
      });
    }

    console.log('\n✨ Seeding complete!');
    
    // Show final count
    const count = await client.query('SELECT COUNT(*) FROM "Category"');
    console.log(`📊 Total categories: ${count.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();

