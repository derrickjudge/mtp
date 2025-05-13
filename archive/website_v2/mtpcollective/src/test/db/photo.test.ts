import { describe, it, expect } from 'vitest';
import { createTestUser, createTestCategory, createTestTag, createTestPhoto } from '../db-utils';
import { prisma } from '../setup';

describe('Photo Model', () => {

  it('should create a photo with basic information', async () => {
    const user = await createTestUser(prisma, {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER',
    });

    const photoData = {
      title: 'Test Photo',
      description: 'A test photo',
      url: '/images/test.jpg',
      thumbnail: '/images/test-thumb.jpg',
      published: true,
      featured: false,
      authorId: user.id,
    };

    const photo = await createTestPhoto(prisma, photoData);

    expect(photo).toBeDefined();
    expect(photo.title).toBe(photoData.title);
    expect(photo.description).toBe(photoData.description);
    expect(photo.url).toBe(photoData.url);
    expect(photo.thumbnail).toBe(photoData.thumbnail);
    expect(photo.published).toBe(photoData.published);
    expect(photo.featured).toBe(photoData.featured);
    expect(photo.authorId).toBe(user.id);
  });

  it('should create a photo with categories and tags', async () => {
    const user = await createTestUser(prisma, {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER',
    });

    const category = await createTestCategory(prisma, {
      name: 'Test Category',
      slug: 'test-category',
      description: 'A test category',
    });

    const tag = await createTestTag(prisma, {
      name: 'Test Tag',
      slug: 'test-tag',
    });

    const photoData = {
      title: 'Test Photo',
      url: '/images/test.jpg',
      authorId: user.id,
      categoryIds: [category.id],
      tagIds: [tag.id],
    };

    const photo = await createTestPhoto(prisma, photoData);

    expect(photo.categories).toHaveLength(1);
    expect(photo.categories[0].id).toBe(category.id);
    expect(photo.tags).toHaveLength(1);
    expect(photo.tags[0].id).toBe(tag.id);
  });

  it('should create a photo with metadata', async () => {
    const user = await createTestUser(prisma, {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER',
    });

    const photoData = {
      title: 'Test Photo',
      url: '/images/test.jpg',
      authorId: user.id,
      metadata: {
        camera: 'Sony A7III',
        lens: '24-70mm f/2.8',
        iso: '100',
        shutterSpeed: '1/250',
        aperture: 'f/2.8',
      },
    };

    const photo = await createTestPhoto(prisma, photoData);

    expect(photo.metadata).toEqual(photoData.metadata);
  });

  it('should update photo details', async () => {
    const user = await createTestUser(prisma, {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER',
    });

    const photo = await createTestPhoto(prisma, {
      title: 'Test Photo',
      url: '/images/test.jpg',
      authorId: user.id,
    });

    const updatedTitle = 'Updated Photo';
    const updatedPhoto = await prisma.photo.update({
      where: { id: photo.id },
      data: { title: updatedTitle },
    });

    expect(updatedPhoto.title).toBe(updatedTitle);
  });

  it('should delete photo', async () => {
    const user = await createTestUser(prisma, {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER',
    });

    const photo = await createTestPhoto(prisma, {
      title: 'Test Photo',
      url: '/images/test.jpg',
      authorId: user.id,
    });

    await prisma.photo.delete({
      where: { id: photo.id },
    });

    const deletedPhoto = await prisma.photo.findUnique({
      where: { id: photo.id },
    });

    expect(deletedPhoto).toBeNull();
  });

  it('should find published photos', async () => {
    const user = await createTestUser(prisma, {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER',
    });

    await createTestPhoto(prisma, {
      title: 'Published Photo',
      url: '/images/published.jpg',
      published: true,
      authorId: user.id,
    });

    await createTestPhoto(prisma, {
      title: 'Unpublished Photo',
      url: '/images/unpublished.jpg',
      published: false,
      authorId: user.id,
    });

    const publishedPhotos = await prisma.photo.findMany({
      where: { published: true },
    });

    expect(publishedPhotos).toHaveLength(1);
    expect(publishedPhotos[0].title).toBe('Published Photo');
  });

  it('should find featured photos', async () => {
    const user = await createTestUser(prisma, {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER',
    });

    await createTestPhoto(prisma, {
      title: 'Featured Photo',
      url: '/images/featured.jpg',
      featured: true,
      authorId: user.id,
    });

    await createTestPhoto(prisma, {
      title: 'Non-Featured Photo',
      url: '/images/non-featured.jpg',
      featured: false,
      authorId: user.id,
    });

    const featuredPhotos = await prisma.photo.findMany({
      where: { featured: true },
    });

    expect(featuredPhotos).toHaveLength(1);
    expect(featuredPhotos[0].title).toBe('Featured Photo');
  });
});
