/**
 * Articles API Route Tests
 *
 * Tests for GET /api/articles published-visibility enforcement and
 * POST /api/articles creation, including the free-text author byline.
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/articles/route';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/db-native', () => ({
  nativeDB: {
    findArticles: jest.fn(),
    getArticleWithRelations: jest.fn(),
    findArticleBySlug: jest.fn(),
    createArticle: jest.fn(),
    linkArticleToCategories: jest.fn(),
    linkArticleToTags: jest.fn(),
    linkArticleToEvents: jest.fn(),
    linkArticleToPhotos: jest.fn(),
  },
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true })),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

import { getServerSession } from 'next-auth';
import { nativeDB } from '@/lib/db-native';
import { rateLimit } from '@/lib/rateLimit';

const adminSession = { user: { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' } };

describe('GET /api/articles - published visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
    (nativeDB.findArticles as jest.Mock).mockResolvedValue([]);
  });

  it('should force published=true for anonymous requests', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/articles');
    await GET(request);

    expect(nativeDB.findArticles).toHaveBeenCalledWith(
      expect.objectContaining({ published: true })
    );
  });

  it('should force published=true when anonymous requests ask for unpublished', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/articles?published=false');
    await GET(request);

    expect(nativeDB.findArticles).toHaveBeenCalledWith(
      expect.objectContaining({ published: true })
    );
  });

  it('should force published=true for non-admin authenticated requests', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const request = new NextRequest('http://localhost:3000/api/articles?published=false');
    await GET(request);

    expect(nativeDB.findArticles).toHaveBeenCalledWith(
      expect.objectContaining({ published: true })
    );
  });

  it('should allow admins to request unpublished articles', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const request = new NextRequest('http://localhost:3000/api/articles?published=false');
    await GET(request);

    expect(nativeDB.findArticles).toHaveBeenCalledWith(
      expect.objectContaining({ published: false })
    );
  });

  it('should return all articles to admins when no param is given', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const request = new NextRequest('http://localhost:3000/api/articles');
    await GET(request);

    expect(nativeDB.findArticles).toHaveBeenCalledWith(
      expect.objectContaining({ published: undefined })
    );
  });

  it('should never CDN-cache admin responses', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const request = new NextRequest('http://localhost:3000/api/articles');
    const response = await GET(request);

    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('CDN-Cache-Control')).toBeNull();
  });

  it('should keep cache headers for anonymous responses', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/articles');
    const response = await GET(request);

    expect(response.headers.get('Cache-Control')).toContain('s-maxage=120');
  });
});

describe('POST /api/articles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
    (getServerSession as jest.Mock).mockResolvedValue(adminSession);
    (nativeDB.findArticleBySlug as jest.Mock).mockResolvedValue(null);
  });

  const postRequest = (body: unknown) =>
    new NextRequest('http://localhost:3000/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('returns 401 when not an admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', role: 'USER' } });

    const response = await POST(postRequest({ title: 'Hello', content: 'World' }));

    expect(response.status).toBe(401);
    expect(nativeDB.createArticle).not.toHaveBeenCalled();
  });

  it('returns 400 when title or content is missing', async () => {
    const response = await POST(postRequest({ title: '', content: 'World' }));
    expect(response.status).toBe(400);
  });

  it('defaults authorName to "Anonymous Author" when omitted', async () => {
    (nativeDB.createArticle as jest.Mock).mockResolvedValue({ id: 'a1' });
    (nativeDB.getArticleWithRelations as jest.Mock).mockResolvedValue({ id: 'a1' });

    await POST(postRequest({ title: 'Hello', content: 'World' }));

    expect(nativeDB.createArticle).toHaveBeenCalledWith(
      expect.objectContaining({ authorName: 'Anonymous Author' })
    );
  });

  it('defaults authorName to "Anonymous Author" when blank', async () => {
    (nativeDB.createArticle as jest.Mock).mockResolvedValue({ id: 'a1' });
    (nativeDB.getArticleWithRelations as jest.Mock).mockResolvedValue({ id: 'a1' });

    await POST(postRequest({ title: 'Hello', content: 'World', authorName: '   ' }));

    expect(nativeDB.createArticle).toHaveBeenCalledWith(
      expect.objectContaining({ authorName: 'Anonymous Author' })
    );
  });

  it('uses a provided free-text authorName without requiring a user account', async () => {
    (nativeDB.createArticle as jest.Mock).mockResolvedValue({ id: 'a1' });
    (nativeDB.getArticleWithRelations as jest.Mock).mockResolvedValue({ id: 'a1' });

    await POST(postRequest({ title: 'Hello', content: 'World', authorName: 'Jane Doe' }));

    expect(nativeDB.createArticle).toHaveBeenCalledWith(
      expect.objectContaining({ authorName: 'Jane Doe' })
    );
  });

  it('always sets authorId to the session user, ignoring any client-provided authorId', async () => {
    (nativeDB.createArticle as jest.Mock).mockResolvedValue({ id: 'a1' });
    (nativeDB.getArticleWithRelations as jest.Mock).mockResolvedValue({ id: 'a1' });

    await POST(postRequest({ title: 'Hello', content: 'World', authorId: 'someone-elses-id' }));

    expect(nativeDB.createArticle).toHaveBeenCalledWith(
      expect.objectContaining({ authorId: 'admin-1' })
    );
  });

  it('returns 400 when authorName exceeds the max length', async () => {
    const response = await POST(
      postRequest({ title: 'Hello', content: 'World', authorName: 'a'.repeat(101) })
    );

    expect(response.status).toBe(400);
    expect(nativeDB.createArticle).not.toHaveBeenCalled();
  });

  it('returns 409 when the slug already exists', async () => {
    (nativeDB.findArticleBySlug as jest.Mock).mockResolvedValue({ id: 'existing' });

    const response = await POST(postRequest({ title: 'Hello', content: 'World' }));

    expect(response.status).toBe(409);
    expect(nativeDB.createArticle).not.toHaveBeenCalled();
  });

  it('links the selected photo set to the new article, preserving order', async () => {
    (nativeDB.createArticle as jest.Mock).mockResolvedValue({ id: 'a1' });
    (nativeDB.getArticleWithRelations as jest.Mock).mockResolvedValue({ id: 'a1' });

    await POST(
      postRequest({ title: 'Hello', content: 'World', photoIds: ['p3', 'p1', 'p2'] })
    );

    expect(nativeDB.linkArticleToPhotos).toHaveBeenCalledWith('a1', ['p3', 'p1', 'p2']);
  });

  it('does not link photos when no photo set is provided', async () => {
    (nativeDB.createArticle as jest.Mock).mockResolvedValue({ id: 'a1' });
    (nativeDB.getArticleWithRelations as jest.Mock).mockResolvedValue({ id: 'a1' });

    await POST(postRequest({ title: 'Hello', content: 'World' }));

    expect(nativeDB.linkArticleToPhotos).not.toHaveBeenCalled();
  });
});
