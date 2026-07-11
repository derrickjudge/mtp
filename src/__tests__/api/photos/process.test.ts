/**
 * Photo Process API Route Tests
 *
 * Tests for POST /api/photos/process: admin-only access, rate limiting,
 * and file validation (type and size caps).
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/photos/process/route';
import { MAX_IMAGE_BYTES } from '@/lib/uploadValidation';

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

jest.mock('@/utils/imageProcessing', () => ({
  generateThumbnail: jest.fn(),
  getImageDimensions: jest.fn(),
}));

import { getServerSession } from 'next-auth';
import { rateLimit } from '@/lib/rateLimit';
import { generateThumbnail, getImageDimensions } from '@/utils/imageProcessing';

function buildRequest(file?: Blob, fileName = 'test.jpg'): NextRequest {
  const formData = new FormData();
  if (file) {
    formData.append('file', file, fileName);
  }
  return new NextRequest('http://localhost:3000/api/photos/process', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/photos/process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
    (generateThumbnail as jest.Mock).mockResolvedValue(Buffer.from('thumb-bytes'));
    (getImageDimensions as jest.Mock).mockResolvedValue({ width: 800, height: 600 });
  });

  it('should return 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await POST(buildRequest(new Blob(['x'], { type: 'image/jpeg' })));

    expect(response.status).toBe(401);
    expect(generateThumbnail).not.toHaveBeenCalled();
  });

  it('should return 401 when user is not admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const response = await POST(buildRequest(new Blob(['x'], { type: 'image/jpeg' })));

    expect(response.status).toBe(401);
    expect(generateThumbnail).not.toHaveBeenCalled();
  });

  it('should return 429 when rate limited', async () => {
    (rateLimit as jest.Mock).mockReturnValue({ allowed: false, retryAfter: 30 });

    const response = await POST(buildRequest(new Blob(['x'], { type: 'image/jpeg' })));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
  });

  it('should return 400 when no file is provided', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const response = await POST(buildRequest());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('File is required');
  });

  it('should return 400 for non-image files', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const file = new Blob(['not an image'], { type: 'application/pdf' });
    const response = await POST(buildRequest(file, 'doc.pdf'));

    expect(response.status).toBe(400);
    expect(generateThumbnail).not.toHaveBeenCalled();
  });

  it('should return 413 for files over the size cap', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const oversized = new Blob([new Uint8Array(MAX_IMAGE_BYTES + 1)], { type: 'image/jpeg' });
    const response = await POST(buildRequest(oversized, 'big.jpg'));

    expect(response.status).toBe(413);
    expect(generateThumbnail).not.toHaveBeenCalled();
  });

  it('should process an image for an admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const response = await POST(buildRequest(new Blob(['image-bytes'], { type: 'image/jpeg' })));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.thumbnail).toContain('data:image/jpeg;base64,');
    expect(data.width).toBe(800);
    expect(data.height).toBe(600);
  });
});
