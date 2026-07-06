/**
 * Articles API Route Tests
 *
 * Tests for GET /api/articles published-visibility enforcement.
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/articles/route';

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
  },
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true })),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

import { getServerSession } from 'next-auth';
import { nativeDB } from '@/lib/db-native';
import { rateLimit } from '@/lib/rateLimit';

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
