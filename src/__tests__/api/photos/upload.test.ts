/**
 * Photo Upload API Route Tests
 * 
 * Tests for POST /api/photos/upload endpoint.
 * This handles multipart form data uploads with R2 storage integration.
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/photos/upload/route';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true })),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

// Mock photoService via dynamic import
const mockUploadPhoto = jest.fn();
jest.mock('@/services/photoService', () => ({
  photoService: {
    uploadPhoto: mockUploadPhoto,
  },
}));

import { getServerSession } from 'next-auth';
import { rateLimit } from '@/lib/rateLimit';

describe('POST /api/photos/upload', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
    // Set R2 config for tests
    process.env = {
      ...originalEnv,
      R2_BUCKET_NAME: 'test-bucket',
      R2_ACCESS_KEY_ID: 'test-key',
      R2_SECRET_ACCESS_KEY: 'test-secret',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('title', 'Test Photo');

    const request = new NextRequest('http://localhost:3000/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 400 when file is missing', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });

    const formData = new FormData();
    formData.append('title', 'Test Photo');

    const request = new NextRequest('http://localhost:3000/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('File is required');
  });

  it('should return 401 when authenticated but not an admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('title', 'Test Photo');

    const request = new NextRequest('http://localhost:3000/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 400 when the file is not an image', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });

    const formData = new FormData();
    formData.append('file', new Blob(['%PDF'], { type: 'application/pdf' }), 'doc.pdf');
    formData.append('title', 'Test Photo');

    const request = new NextRequest('http://localhost:3000/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toMatch(/image/i);
  });

  it('should return 400 when title is missing', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');

    const request = new NextRequest('http://localhost:3000/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Title is required');
  });

  it('should return 503 when R2 is not configured', async () => {
    process.env = {
      ...originalEnv,
      R2_BUCKET_NAME: undefined,
      R2_ACCESS_KEY_ID: undefined,
      R2_SECRET_ACCESS_KEY: undefined,
    };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('title', 'Test Photo');

    const request = new NextRequest('http://localhost:3000/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.message).toContain('Photo upload is not configured');
  });

  it('should upload photo successfully with all fields', async () => {
    const mockPhoto = {
      id: 'photo-1',
      title: 'Test Photo',
      url: 'https://example.com/photo.jpg',
    };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    mockUploadPhoto.mockResolvedValue(mockPhoto);

    const formData = new FormData();
    const file = new Blob(['test image content'], { type: 'image/jpeg' });
    formData.append('file', file, 'test-photo.jpg');
    formData.append('title', 'Test Photo');
    formData.append('description', 'A test photo description');
    formData.append('categoryIds', 'cat-1');
    formData.append('categoryIds', 'cat-2');
    formData.append('tagIds', 'tag-1');
    formData.append('eventIds', 'event-1');

    const request = new NextRequest('http://localhost:3000/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockPhoto);
    expect(mockUploadPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'test-photo.jpg',
        contentType: 'image/jpeg',
        title: 'Test Photo',
        description: 'A test photo description',
        categoryIds: ['cat-1', 'cat-2'],
        tagIds: ['tag-1'],
        eventIds: ['event-1'],
        authorId: 'user-1',
      })
    );
  });

  it('should handle upload with minimal fields', async () => {
    const mockPhoto = { id: 'photo-1', title: 'Simple Photo' };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    mockUploadPhoto.mockResolvedValue(mockPhoto);

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/png' }), 'simple.png');
    formData.append('title', 'Simple Photo');

    const request = new NextRequest('http://localhost:3000/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockUploadPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Simple Photo',
        categoryIds: [],
        tagIds: [],
        eventIds: [],
      })
    );
  });

  it('should return 429 when rate limited', async () => {
    (rateLimit as jest.Mock).mockReturnValue({ allowed: false, retryAfter: 120 });

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('title', 'Test Photo');

    const request = new NextRequest('http://localhost:3000/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('120');
  });

  it('should handle upload errors gracefully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    mockUploadPhoto.mockRejectedValue(new Error('R2 upload failed'));

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('title', 'Test Photo');

    const request = new NextRequest('http://localhost:3000/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    // The internal error detail must not leak to the client.
    expect(response.status).toBe(500);
    expect(data.message).toBe('Failed to upload photo');
    expect(data.message).not.toContain('R2');
  });

  it('should include file metadata in upload call', async () => {
    const mockPhoto = { id: 'photo-1' };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    mockUploadPhoto.mockResolvedValue(mockPhoto);

    const fileContent = 'test image bytes';
    const file = new Blob([fileContent], { type: 'image/webp' });
    const formData = new FormData();
    formData.append('file', file, 'photo.webp');
    formData.append('title', 'WebP Photo');

    const request = new NextRequest('http://localhost:3000/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    await POST(request);

    expect(mockUploadPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: 'image/webp',
        metadata: expect.objectContaining({
          originalName: 'photo.webp',
          type: 'image/webp',
        }),
      })
    );
  });
});

