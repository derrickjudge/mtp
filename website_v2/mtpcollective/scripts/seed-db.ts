import { PrismaClient } from '../src/generated/prisma/index.js';
import { hash } from 'bcrypt';

async function seed() {
  console.log('Starting database seed...');
  
  // Create a new PrismaClient instance
  const prisma = new PrismaClient();
  
  try {
    // Clean up existing data
    console.log('Cleaning up existing data...');
    const tablesToClean = ['Photo', 'Article', 'Tag', 'Category', 'User'];
    
    for (const table of tablesToClean) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    }
    console.log('Data cleanup complete.');

    // Create admin user
    console.log('Creating admin user...');
    const adminPassword = await hash('admin123', 12);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@mtpcollective.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN',
      },
    });
    console.log('Admin user created.');

    // Create categories
    console.log('Creating categories...');
    const concertsCategory = await prisma.category.create({
      data: {
        name: 'Concerts',
        slug: 'concerts',
        description: 'Live music and performance photography',
      },
    });

    const automotiveCategory = await prisma.category.create({
      data: {
        name: 'Automotive',
        slug: 'automotive',
        description: 'Car and motorsport photography',
      },
    });

    const natureCategory = await prisma.category.create({
      data: {
        name: 'Nature',
        slug: 'nature',
        description: 'Landscape and wildlife photography',
      },
    });
    console.log('Categories created.');

    // Create tags
    console.log('Creating tags...');
    const featuredTag = await prisma.tag.create({
      data: { name: 'Featured', slug: 'featured' },
    });

    const bwTag = await prisma.tag.create({
      data: { name: 'Black & White', slug: 'black-and-white' },
    });

    const colorTag = await prisma.tag.create({
      data: { name: 'Color', slug: 'color' },
    });
    console.log('Tags created.');

    // Create sample photos
    console.log('Creating sample photos...');
    await prisma.photo.create({
      data: {
        title: 'Concert Stage Lights',
        description: 'Dramatic stage lighting at a rock concert',
        url: '/images/photos/concerts/stage-lights.jpg',
        thumbnail: '/images/photos/concerts/stage-lights-thumb.jpg',
        published: true,
        featured: true,
        authorId: admin.id,
        categories: {
          connect: [{ id: concertsCategory.id }],
        },
        tags: {
          connect: [{ id: featuredTag.id }],
        },
        metadata: {
          camera: 'Sony A7III',
          lens: '24-70mm f/2.8',
          iso: '1600',
          shutterSpeed: '1/250',
          aperture: 'f/2.8',
        },
      },
    });

    await prisma.photo.create({
      data: {
        title: 'Classic Car Show',
        description: 'Vintage automobiles on display',
        url: '/images/photos/automotive/classic-cars.jpg',
        thumbnail: '/images/photos/automotive/classic-cars-thumb.jpg',
        published: true,
        featured: true,
        authorId: admin.id,
        categories: {
          connect: [{ id: automotiveCategory.id }],
        },
        tags: {
          connect: [{ id: featuredTag.id }],
        },
        metadata: {
          camera: 'Canon R5',
          lens: '70-200mm f/2.8',
          iso: '100',
          shutterSpeed: '1/500',
          aperture: 'f/4',
        },
      },
    });
    console.log('Sample photos created.');

    // Create sample articles
    console.log('Creating sample articles...');
    await prisma.article.create({
      data: {
        title: 'Concert Photography Tips',
        slug: 'concert-photography-tips',
        content: '# Concert Photography Tips\n\nCapturing great concert photos requires...',
        excerpt: 'Essential tips for capturing amazing concert photographs',
        coverImage: '/images/articles/concert-tips-cover.jpg',
        published: true,
        featured: true,
        authorId: admin.id,
        categories: {
          connect: [{ id: concertsCategory.id }],
        },
        tags: {
          connect: [{ id: featuredTag.id }],
        },
      },
    });

    await prisma.article.create({
      data: {
        title: 'Automotive Photography Guide',
        slug: 'automotive-photography-guide',
        content: '# Automotive Photography Guide\n\nMastering automotive photography...',
        excerpt: 'Complete guide to professional automotive photography',
        coverImage: '/images/articles/auto-guide-cover.jpg',
        published: true,
        featured: true,
        authorId: admin.id,
        categories: {
          connect: [{ id: automotiveCategory.id }],
        },
        tags: {
          connect: [{ id: featuredTag.id }],
        },
      },
    });
    console.log('Sample articles created.');

    console.log('Seed data created successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
