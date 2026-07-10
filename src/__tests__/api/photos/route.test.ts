/**
 * Photos API Route Tests
 * 
 * Tests for GET /api/photos and POST /api/photos endpoints.
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/photos/route';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/services/photoService', () => ({
  photoService: {
    getPhotos: jest.fn(),
    uploadPhoto: jest.fn(),
  },
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true })),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

import { getServerSession } from 'next-auth';
import { photoService } from '@/services/photoService';
import { rateLimit } from '@/lib/rateLimit';

describe('GET /api/photos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
  });

  it('should return photos successfully', async () => {
    const mockPhotos = [
      { id: '1', title: 'Test Photo 1', url: 'https://example.com/photo1.jpg' },
      { id: '2', title: 'Test Photo 2', url: 'https://example.com/photo2.jpg' },
    ];
    (photoService.getPhotos as jest.Mock).mockResolvedValue(mockPhotos);

    const request = new NextRequest('http://localhost:3000/api/photos');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.photos).toEqual(mockPhotos);
    expect(photoService.getPhotos).toHaveBeenCalledWith({
      categoryId: undefined,
      tagId: undefined,
      eventId: undefined,
      featured: undefined,
      published: true,
      take: undefined,
      skip: undefined,
    });
  });

  it('should filter photos by category', async () => {
    (photoService.getPhotos as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/photos?category=sports');
    await GET(request);

    expect(photoService.getPhotos).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'sports' })
    );
  });

  it('should filter photos by featured flag', async () => {
    (photoService.getPhotos as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/photos?featured=true');
    await GET(request);

    expect(photoService.getPhotos).toHaveBeenCalledWith(
      expect.objectContaining({ featured: true })
    );
  });

  it('should support pagination with take and skip', async () => {
    (photoService.getPhotos as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/photos?take=10&skip=20');
    await GET(request);

    expect(photoService.getPhotos).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, skip: 20 })
    );
  });

  it('should return 429 when rate limited', async () => {
    (rateLimit as jest.Mock).mockReturnValue({ allowed: false, retryAfter: 30 });

    const request = new NextRequest('http://localhost:3000/api/photos');
    const response = await GET(request);

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
  });

  it('should set no-store cache for unfiltered requests', async () => {
    (photoService.getPhotos as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/photos');
    const response = await GET(request);

    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('should set cache headers for filtered requests', async () => {
    (photoService.getPhotos as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/photos?category=sports');
    const response = await GET(request);

    expect(response.headers.get('Cache-Control')).toContain('s-maxage=120');
  });

  it('should handle errors gracefully', async () => {
    (photoService.getPhotos as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/photos');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Failed to fetch photos');
  });
});

describe('GET /api/photos - published visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
    (photoService.getPhotos as jest.Mock).mockResolvedValue([]);
  });

  it('should force published=true for anonymous requests asking for unpublished', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/photos?published=false');
    await GET(request);

    expect(photoService.getPhotos).toHaveBeenCalledWith(
      expect.objectContaining({ published: true })
    );
  });

  it('should force published=true for non-admin authenticated requests', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const request = new NextRequest('http://localhost:3000/api/photos?published=false');
    await GET(request);

    expect(photoService.getPhotos).toHaveBeenCalledWith(
      expect.objectContaining({ published: true })
    );
  });

  it('should allow admins to request unpublished photos', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const request = new NextRequest('http://localhost:3000/api/photos?published=false');
    await GET(request);

    expect(photoService.getPhotos).toHaveBeenCalledWith(
      expect.objectContaining({ published: false })
    );
  });

  it('should return all photos (published and unpublished) to admins when no param is given', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const request = new NextRequest('http://localhost:3000/api/photos');
    await GET(request);

    expect(photoService.getPhotos).toHaveBeenCalledWith(
      expect.objectContaining({ published: undefined })
    );
  });

  it('should never CDN-cache admin responses, even for filtered requests', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const request = new NextRequest('http://localhost:3000/api/photos?category=sports');
    const response = await GET(request);

    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('CDN-Cache-Control')).toBeNull();
  });
});

describe('POST /api/photos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
  });

  it('should return 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('title', 'Test Photo');

    const request = new NextRequest('http://localhost:3000/api/photos', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 401 when authenticated but not an admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('title', 'Test Photo');

    const request = new NextRequest('http://localhost:3000/api/photos', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Unauthorized');
    expect(photoService.uploadPhoto).not.toHaveBeenCalled();
  });

  it('should return 400 when file is missing', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });

    const formData = new FormData();
    formData.append('title', 'Test Photo');

    const request = new NextRequest('http://localhost:3000/api/photos', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('File is required');
  });

  it('should return 400 when the file is not an image', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });

    const formData = new FormData();
    formData.append('file', new Blob(['%PDF'], { type: 'application/pdf' }), 'doc.pdf');
    formData.append('title', 'Test Photo');

    const request = new NextRequest('http://localhost:3000/api/photos', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toMatch(/image/i);
    expect(photoService.uploadPhoto).not.toHaveBeenCalled();
  });

  it('should return 400 when title is missing', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');

    const request = new NextRequest('http://localhost:3000/api/photos', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Title is required');
  });

  it('should upload photo successfully when authenticated', async () => {
    const mockPhoto = { id: 'photo-1', title: 'Test Photo', url: 'https://example.com/photo.jpg' };
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    (photoService.uploadPhoto as jest.Mock).mockResolvedValue(mockPhoto);

    const formData = new FormData();
    const file = new Blob(['test image data'], { type: 'image/jpeg' });
    formData.append('file', file, 'test.jpg');
    formData.append('title', 'Test Photo');
    formData.append('description', 'A test photo');
    formData.append('categoryIds', 'cat-1');
    formData.append('categoryIds', 'cat-2');

    const request = new NextRequest('http://localhost:3000/api/photos', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockPhoto);
    expect(photoService.uploadPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Photo',
        description: 'A test photo',
        categoryIds: ['cat-1', 'cat-2'],
        authorId: 'user-1',
      })
    );
  });

  it('should return 429 when rate limited', async () => {
    (rateLimit as jest.Mock).mockReturnValue({ allowed: false, retryAfter: 60 });

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('title', 'Test Photo');

    const request = new NextRequest('http://localhost:3000/api/photos', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('should handle upload errors gracefully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    (photoService.uploadPhoto as jest.Mock).mockRejectedValue(new Error('Upload failed'));

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('title', 'Test Photo');

    const request = new NextRequest('http://localhost:3000/api/photos', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Failed to upload photo');
  });
});

