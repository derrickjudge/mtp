import { describe, it, expect } from 'vitest';
import { createTestUser, createTestCategory, createTestTag, createTestPhoto, createTestArticle } from '../db-utils';
import { prisma } from '../setup';

describe('Category and Tag Models', () => {

  describe('Category Model', () => {
    it('should create a category with basic information', async () => {
      const categoryData = {
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category',
      };

      const category = await createTestCategory(prisma, categoryData);

      expect(category).toBeDefined();
      expect(category.name).toBe(categoryData.name);
      expect(category.slug).toBe(categoryData.slug);
      expect(category.description).toBe(categoryData.description);
    });

    it('should enforce unique slugs for categories', async () => {
      const categoryData = {
        name: 'Test Category',
        slug: 'test-category',
      };

      await createTestCategory(prisma, categoryData);

      // Try to create another category with the same slug
      await expect(createTestCategory(prisma, categoryData)).rejects.toThrow();
    });

    it('should associate photos with a category', async () => {
      const user = await createTestUser(prisma, {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        role: 'USER',
      });

      const category = await createTestCategory(prisma, {
        name: 'Test Category',
        slug: 'test-category',
      });

      const photo = await createTestPhoto(prisma, {
        title: 'Test Photo',
        url: '/images/test.jpg',
        authorId: user.id,
        categoryIds: [category.id],
      });

      const photosInCategory = await prisma.photo.findMany({
        where: {
          categories: {
            some: {
              id: category.id,
            },
          },
        },
      });

      expect(photosInCategory).toHaveLength(1);
      expect(photosInCategory[0].id).toBe(photo.id);
    });

    it('should associate articles with a category', async () => {
      const user = await createTestUser(prisma, {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        role: 'USER',
      });

      const category = await createTestCategory(prisma, {
        name: 'Test Category',
        slug: 'test-category',
      });

      const article = await createTestArticle(prisma, {
        title: 'Test Article',
        slug: 'test-article',
        content: '# Test Article',
        authorId: user.id,
        categoryIds: [category.id],
      });

      const articlesInCategory = await prisma.article.findMany({
        where: {
          categories: {
            some: {
              id: category.id,
            },
          },
        },
      });

      expect(articlesInCategory).toHaveLength(1);
      expect(articlesInCategory[0].id).toBe(article.id);
    });
  });

  describe('Tag Model', () => {
    it('should create a tag with basic information', async () => {
      const tagData = {
        name: 'Test Tag',
        slug: 'test-tag',
      };

      const tag = await createTestTag(tagData);

      expect(tag).toBeDefined();
      expect(tag.name).toBe(tagData.name);
      expect(tag.slug).toBe(tagData.slug);
    });

    it('should enforce unique slugs for tags', async () => {
      const tagData = {
        name: 'Test Tag',
        slug: 'test-tag',
      };

      await createTestTag(tagData);

      // Try to create another tag with the same slug
      await expect(createTestTag(tagData)).rejects.toThrow();
    });

    it('should associate photos with a tag', async () => {
      const user = await createTestUser(prisma, {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        role: 'USER',
      });

      const tag = await createTestTag(prisma, {
        name: 'Test Tag',
        slug: 'test-tag',
      });

      const photo = await createTestPhoto(prisma, {
        title: 'Test Photo',
        url: '/images/test.jpg',
        authorId: user.id,
        tagIds: [tag.id],
      });

      const photosWithTag = await prisma.photo.findMany({
        where: {
          tags: {
            some: {
              id: tag.id,
            },
          },
        },
      });

      expect(photosWithTag).toHaveLength(1);
      expect(photosWithTag[0].id).toBe(photo.id);
    });

    it('should associate articles with a tag', async () => {
      const user = await createTestUser(prisma, {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        role: 'USER',
      });

      const tag = await createTestTag(prisma, {
        name: 'Test Tag',
        slug: 'test-tag',
      });

      const article = await createTestArticle(prisma, {
        title: 'Test Article',
        slug: 'test-article',
        content: '# Test Article',
        authorId: user.id,
        tagIds: [tag.id],
      });

      const articlesWithTag = await prisma.article.findMany({
        where: {
          tags: {
            some: {
              id: tag.id,
            },
          },
        },
      });

      expect(articlesWithTag).toHaveLength(1);
      expect(articlesWithTag[0].id).toBe(article.id);
    });

    it('should delete tag and maintain referential integrity', async () => {
      const user = await createTestUser(prisma, {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        role: 'USER',
      });

      const tag = await createTestTag(prisma, {
        name: 'Test Tag',
        slug: 'test-tag',
      });

      const photo = await createTestPhoto(prisma, {
        title: 'Test Photo',
        url: '/images/test.jpg',
        authorId: user.id,
        tagIds: [tag.id],
      });

      // Delete the tag
      await prisma.tag.delete({
        where: { id: tag.id },
      });

      // Check that the photo still exists
      const existingPhoto = await prisma.photo.findUnique({
        where: { id: photo.id },
        include: { tags: true },
      });

      expect(existingPhoto).toBeDefined();
      expect(existingPhoto?.tags).toHaveLength(0);
    });
  });
});
