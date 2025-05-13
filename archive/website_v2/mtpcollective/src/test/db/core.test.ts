import { describe, it, expect, beforeEach } from 'vitest';
import { compare } from 'bcrypt';
import { MockDBService } from '../mocks/db-service';

describe('Core Database Functionality', () => {
  let db: MockDBService;

  beforeEach(async () => {
    db = new MockDBService();
    await db.reset();
  });

  it('should create and authenticate a user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER' as const,
    };

    const createdUser = await db.createUser(userData);

    const user = await db.findUserByEmail(userData.email);
    expect(user).toBeDefined();
    expect(user?.email).toBe(userData.email);
    expect(user?.name).toBe(userData.name);
    expect(user?.role).toBe(userData.role);

    const passwordMatches = await compare(userData.password, user?.password || '');
    expect(passwordMatches).toBe(true);
  });

  it('should create a photo with author', async () => {
    const testUser = await db.createUser({
      email: 'photographer@example.com',
      name: 'Test Photographer',
      password: 'password123',
      role: 'USER' as const,
    });

    const photoData = {
      title: 'Test Photo',
      description: 'A test photo',
      url: '/images/test.jpg',
      authorId: testUser.id,
    };

    const photo = await db.createPhoto(photoData);

    expect(photo).toBeDefined();
    expect(photo.title).toBe(photoData.title);
    expect(photo.url).toBe(photoData.url);
    expect(photo.description).toBe(photoData.description);
    expect(photo.authorId).toBe(testUser.id);

    const author = await db.findUserByEmail(testUser.email);
    expect(author).toBeDefined();
    expect(author?.name).toBe(testUser.name);
  });

  it('should create an article with author', async () => {
    const testUser = await db.createUser({
      email: 'writer@example.com',
      name: 'Test Writer',
      password: 'password123',
      role: 'USER' as const,
    });

    const articleData = {
      title: 'Test Article',
      slug: 'test-article',
      content: '# Test Article\n\nThis is a test article.',
      authorId: testUser.id,
    };

    const article = await db.createArticle(articleData);

    expect(article).toBeDefined();
    expect(article.title).toBe(articleData.title);
    expect(article.slug).toBe(articleData.slug);
    expect(article.content).toBe(articleData.content);
    expect(article.authorId).toBe(testUser.id);

    const author = await db.findUserByEmail(testUser.email);
    expect(author).toBeDefined();
    expect(author?.name).toBe(testUser.name);
  });
});
