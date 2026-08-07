/**
 * Articles [id] API Route Tests
 *
 * Tests for PUT /api/articles/[id], focused on the free-text author byline.
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { PUT } from '@/app/api/articles/[id]/route';

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/db-native', () => ({
  nativeDB: {
    findArticleById: jest.fn(),
    findArticleBySlug: jest.fn(),
    updateArticle: jest.fn(),
    getArticleWithRelations: jest.fn(),
    clearArticleCategories: jest.fn(),
    clearArticleTags: jest.fn(),
    clearArticleEvents: jest.fn(),
    clearArticlePhotos: jest.fn(),
    linkArticleToCategories: jest.fn(),
    linkArticleToTags: jest.fn(),
    linkArticleToEvents: jest.fn(),
    linkArticleToPhotos: jest.fn(),
  },
}));

import { getServerSession } from 'next-auth';
import { nativeDB } from '@/lib/db-native';

const adminSession = { user: { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' } };

const existingArticle = {
  id: 'article-1',
  title: 'Old Title',
  slug: 'old-title',
  authorId: 'admin-1',
  authorName: 'Old Byline',
  contentFormat: 'HTML',
};

describe('PUT /api/articles/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(adminSession);
    (nativeDB.findArticleById as jest.Mock).mockResolvedValue(existingArticle);
    (nativeDB.updateArticle as jest.Mock).mockResolvedValue({ id: 'article-1' });
    (nativeDB.getArticleWithRelations as jest.Mock).mockResolvedValue({ id: 'article-1' });
  });

  const putRequest = (body: unknown) =>
    new NextRequest('http://localhost:3000/api/articles/article-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const call = (body: unknown, id = 'article-1') => PUT(putRequest(body), { params: { id } });

  it('leaves contentFormat unchanged when the field is omitted', async () => {
    await call({ title: 'Old Title', content: '<p>Body</p>' });

    expect(nativeDB.updateArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ contentFormat: 'HTML' })
    );
  });

  it('switches contentFormat when the field is supplied', async () => {
    await call({ title: 'Old Title', content: 'Body', contentFormat: 'TEXT' });

    expect(nativeDB.updateArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ contentFormat: 'TEXT' })
    );
  });

  it('falls back to the default when the stored article predates the column', async () => {
    (nativeDB.findArticleById as jest.Mock).mockResolvedValue({
      ...existingArticle,
      contentFormat: undefined,
    });

    await call({ title: 'Old Title', content: 'Body' });

    expect(nativeDB.updateArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ contentFormat: 'TEXT' })
    );
  });

  it('returns 400 for an unrecognized contentFormat', async () => {
    const response = await call({ title: 'Old Title', content: 'Body', contentFormat: 'markdown' });

    expect(response.status).toBe(400);
    expect(nativeDB.updateArticle).not.toHaveBeenCalled();
  });

  it('returns 401 when not an admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', role: 'USER' } });

    const response = await call({ title: 'Old Title', content: 'Body' });
    expect(response.status).toBe(401);
    expect(nativeDB.updateArticle).not.toHaveBeenCalled();
  });

  it('keeps the existing authorName when omitted from the update', async () => {
    await call({ title: 'Old Title', content: 'Body' });

    expect(nativeDB.updateArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ authorName: 'Old Byline' })
    );
  });

  it('resets authorName to "Anonymous Author" when explicitly cleared', async () => {
    await call({ title: 'Old Title', content: 'Body', authorName: '' });

    expect(nativeDB.updateArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ authorName: 'Anonymous Author' })
    );
  });

  it('updates to a new free-text authorName without requiring a user account', async () => {
    await call({ title: 'Old Title', content: 'Body', authorName: 'Jane Doe' });

    expect(nativeDB.updateArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ authorName: 'Jane Doe' })
    );
  });

  it('returns 400 when authorName exceeds the max length', async () => {
    const response = await call({ title: 'Old Title', content: 'Body', authorName: 'a'.repeat(101) });

    expect(response.status).toBe(400);
    expect(nativeDB.updateArticle).not.toHaveBeenCalled();
  });

  it('always keeps authorId as the existing value, ignoring any client-provided authorId', async () => {
    await call({ title: 'Old Title', content: 'Body', authorId: 'someone-elses-id' });

    expect(nativeDB.updateArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ authorId: 'admin-1' })
    );
  });

  it('returns 404 when the article does not exist', async () => {
    (nativeDB.findArticleById as jest.Mock).mockResolvedValue(null);

    const response = await call({ title: 'Old Title', content: 'Body' }, 'missing-1');
    expect(response.status).toBe(404);
  });

  it('replaces the photo set with the submitted order', async () => {
    await call({ title: 'Old Title', content: 'Body', photoIds: ['p2', 'p1'] });

    expect(nativeDB.clearArticlePhotos).toHaveBeenCalledWith('article-1');
    expect(nativeDB.linkArticleToPhotos).toHaveBeenCalledWith('article-1', ['p2', 'p1']);
  });

  it('clears the photo set when an empty selection is submitted', async () => {
    await call({ title: 'Old Title', content: 'Body', photoIds: [] });

    expect(nativeDB.clearArticlePhotos).toHaveBeenCalledWith('article-1');
    expect(nativeDB.linkArticleToPhotos).not.toHaveBeenCalled();
  });
});
