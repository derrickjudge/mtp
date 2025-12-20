/**
 * Event Photos Curation API Tests
 * 
 * Tests for GET /api/events/[id]/photos and PUT /api/events/[id]/photos endpoints.
 * These endpoints handle photo ordering and top selection curation for events.
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/events/[id]/photos/route';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/db-native', () => ({
  nativeDB: {
    getEventWithRelations: jest.fn(),
    setEventPhotoCuration: jest.fn(),
  },
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true })),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

import { getServerSession } from 'next-auth';
import { nativeDB } from '@/lib/db-native';
import { rateLimit } from '@/lib/rateLimit';

describe('GET /api/events/[id]/photos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
  });

  it('should return event photos successfully', async () => {
    const mockPhotos = [
      { id: 'photo-1', title: 'Photo 1', position: 1, is_top_selection: true },
      { id: 'photo-2', title: 'Photo 2', position: 2, is_top_selection: false },
    ];
    const mockEvent = { id: 'event-1', name: 'Test Event', photos: mockPhotos };

    (nativeDB.getEventWithRelations as jest.Mock).mockResolvedValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/events/event-1/photos');
    const response = await GET(request, { params: { id: 'event-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.photos).toEqual(mockPhotos);
    expect(nativeDB.getEventWithRelations).toHaveBeenCalledWith('event-1');
  });

  it('should return 404 when event is not found', async () => {
    (nativeDB.getEventWithRelations as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/events/nonexistent/photos');
    const response = await GET(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe('Event not found');
  });

  it('should return 429 when rate limited', async () => {
    (rateLimit as jest.Mock).mockReturnValue({ allowed: false, retryAfter: 30 });

    const request = new NextRequest('http://localhost:3000/api/events/event-1/photos');
    const response = await GET(request, { params: { id: 'event-1' } });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
  });

  it('should handle errors gracefully', async () => {
    (nativeDB.getEventWithRelations as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/events/event-1/photos');
    const response = await GET(request, { params: { id: 'event-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Failed to fetch event photos');
  });
});

describe('PUT /api/events/[id]/photos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
  });

  it('should return 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/events/event-1/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderedPhotoIds: ['photo-1', 'photo-2'],
        topPhotoIds: ['photo-1'],
      }),
    });

    const response = await PUT(request, { params: { id: 'event-1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 401 when user is not admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const request = new NextRequest('http://localhost:3000/api/events/event-1/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderedPhotoIds: ['photo-1', 'photo-2'],
        topPhotoIds: ['photo-1'],
      }),
    });

    const response = await PUT(request, { params: { id: 'event-1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 400 when orderedPhotoIds is missing', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });

    const request = new NextRequest('http://localhost:3000/api/events/event-1/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topPhotoIds: ['photo-1'],
      }),
    });

    const response = await PUT(request, { params: { id: 'event-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('orderedPhotoIds and topPhotoIds arrays are required');
  });

  it('should return 400 when topPhotoIds is missing', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });

    const request = new NextRequest('http://localhost:3000/api/events/event-1/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderedPhotoIds: ['photo-1', 'photo-2'],
      }),
    });

    const response = await PUT(request, { params: { id: 'event-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('orderedPhotoIds and topPhotoIds arrays are required');
  });

  it('should update photo curation successfully', async () => {
    const mockUpdatedEvent = {
      id: 'event-1',
      photos: [
        { id: 'photo-2', position: 1, is_top_selection: true },
        { id: 'photo-1', position: 2, is_top_selection: false },
      ],
    };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    (nativeDB.setEventPhotoCuration as jest.Mock).mockResolvedValue(undefined);
    (nativeDB.getEventWithRelations as jest.Mock).mockResolvedValue(mockUpdatedEvent);

    const request = new NextRequest('http://localhost:3000/api/events/event-1/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderedPhotoIds: ['photo-2', 'photo-1'],
        topPhotoIds: ['photo-2'],
      }),
    });

    const response = await PUT(request, { params: { id: 'event-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.photos).toEqual(mockUpdatedEvent.photos);
    expect(nativeDB.setEventPhotoCuration).toHaveBeenCalledWith(
      'event-1',
      ['photo-2', 'photo-1'],
      ['photo-2']
    );
  });

  it('should return 429 when rate limited', async () => {
    (rateLimit as jest.Mock).mockReturnValue({ allowed: false, retryAfter: 60 });

    const request = new NextRequest('http://localhost:3000/api/events/event-1/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderedPhotoIds: ['photo-1'],
        topPhotoIds: [],
      }),
    });

    const response = await PUT(request, { params: { id: 'event-1' } });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('should handle curation errors gracefully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    (nativeDB.setEventPhotoCuration as jest.Mock).mockRejectedValue(new Error('Update failed'));

    const request = new NextRequest('http://localhost:3000/api/events/event-1/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderedPhotoIds: ['photo-1'],
        topPhotoIds: [],
      }),
    });

    const response = await PUT(request, { params: { id: 'event-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Failed to update event photo curation');
  });

  it('should handle empty arrays', async () => {
    const mockUpdatedEvent = { id: 'event-1', photos: [] };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    (nativeDB.setEventPhotoCuration as jest.Mock).mockResolvedValue(undefined);
    (nativeDB.getEventWithRelations as jest.Mock).mockResolvedValue(mockUpdatedEvent);

    const request = new NextRequest('http://localhost:3000/api/events/event-1/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderedPhotoIds: [],
        topPhotoIds: [],
      }),
    });

    const response = await PUT(request, { params: { id: 'event-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.photos).toEqual([]);
  });
});

