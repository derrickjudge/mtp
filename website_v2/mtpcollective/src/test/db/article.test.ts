import { describe, it, expect } from 'vitest';
import { createTestUser, createTestCategory, createTestTag, createTestArticle } from '../db-utils';
import { prisma } from '../setup';

describe('Article Model', () => {

  it('should create an article with basic information', async () => {
    const user = await createTestUser(prisma, {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER',
    });

    const articleData = {
      title: 'Test Article',
      slug: 'test-article',
      content: '# Test Article\n\nThis is a test article.',
      excerpt: 'A test article',
      coverImage: '/images/test-cover.jpg',
      published: true,
      featured: false,
      authorId: user.id,
    };

    const article = await createTestArticle(prisma, articleData);

    expect(article).toBeDefined();
    expect(article.title).toBe(articleData.title);
    expect(article.slug).toBe(articleData.slug);
    expect(article.content).toBe(articleData.content);
    expect(article.excerpt).toBe(articleData.excerpt);
    expect(article.coverImage).toBe(articleData.coverImage);
    expect(article.published).toBe(articleData.published);
    expect(article.featured).toBe(articleData.featured);
    expect(article.authorId).toBe(user.id);
  });

  it('should create an article with categories and tags', async () => {
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

    const articleData = {
      title: 'Test Article',
      slug: 'test-article',
      content: '# Test Article\n\nThis is a test article.',
      authorId: user.id,
      categoryIds: [category.id],
      tagIds: [tag.id],
    };

    const article = await createTestArticle(prisma, articleData);

    expect(article.categories).toHaveLength(1);
    expect(article.categories[0].id).toBe(category.id);
    expect(article.tags).toHaveLength(1);
    expect(article.tags[0].id).toBe(tag.id);
  });

  it('should enforce unique slugs', async () => {
    const user = await createTestUser(prisma, {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER',
    });

    const articleData = {
      title: 'Test Article',
      slug: 'test-article',
      content: '# Test Article\n\nThis is a test article.',
      authorId: user.id,
    };

    await createTestArticle(prisma, articleData);

    // Try to create another article with the same slug
    await expect(createTestArticle(prisma, articleData)).rejects.toThrow();
  });

  it('should update article details', async () => {
    const user = await createTestUser(prisma, {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER',
    });

    const article = await createTestArticle(prisma, {
      title: 'Test Article',
      slug: 'test-article',
      content: '# Test Article\n\nThis is a test article.',
      authorId: user.id,
    });

    const updatedTitle = 'Updated Article';
    const updatedArticle = await prisma.article.update({
      where: { id: article.id },
      data: { title: updatedTitle },
    });

    expect(updatedArticle.title).toBe(updatedTitle);
  });

  it('should delete article', async () => {
    const user = await createTestUser(prisma, {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER',
    });

    const article = await createTestArticle(prisma, {
      title: 'Test Article',
      slug: 'test-article',
      content: '# Test Article\n\nThis is a test article.',
      authorId: user.id,
    });

    await prisma.article.delete({
      where: { id: article.id },
    });

    const deletedArticle = await prisma.article.findUnique({
      where: { id: article.id },
    });

    expect(deletedArticle).toBeNull();
  });

  it('should find published articles', async () => {
    const user = await createTestUser(prisma, {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER',
    });

    await createTestArticle(prisma, {
      title: 'Published Article',
      slug: 'published-article',
      content: '# Published Article',
      published: true,
      authorId: user.id,
    });

    await createTestArticle(prisma, {
      title: 'Unpublished Article',
      slug: 'unpublished-article',
      content: '# Unpublished Article',
      published: false,
      authorId: user.id,
    });

    const publishedArticles = await prisma.article.findMany({
      where: { published: true },
    });

    expect(publishedArticles).toHaveLength(1);
    expect(publishedArticles[0].title).toBe('Published Article');
  });

  it('should find featured articles', async () => {
    const user = await createTestUser(prisma, {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER',
    });

    await createTestArticle(prisma, {
      title: 'Featured Article',
      slug: 'featured-article',
      content: '# Featured Article',
      featured: true,
      authorId: user.id,
    });

    await createTestArticle(prisma, {
      title: 'Non-Featured Article',
      slug: 'non-featured-article',
      content: '# Non-Featured Article',
      featured: false,
      authorId: user.id,
    });

    const featuredArticles = await prisma.article.findMany({
      where: { featured: true },
    });

    expect(featuredArticles).toHaveLength(1);
    expect(featuredArticles[0].title).toBe('Featured Article');
  });
});
