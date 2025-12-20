/**
 * Events API Route Tests
 * 
 * Tests for GET /api/events and POST /api/events endpoints.
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/events/route';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/db-native', () => ({
  nativeDB: {
    findEvents: jest.fn(),
    getEventWithRelations: jest.fn(),
    findEventBySlug: jest.fn(),
    createEvent: jest.fn(),
    linkEventToCategories: jest.fn(),
    linkEventToPhotos: jest.fn(),
    linkEventToArticles: jest.fn(),
  },
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true })),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

import { getServerSession } from 'next-auth';
import { nativeDB } from '@/lib/db-native';
import { rateLimit } from '@/lib/rateLimit';

describe('GET /api/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
  });

  it('should return events successfully', async () => {
    const mockEvents = [
      { id: '1', name: 'Event 1', slug: 'event-1' },
      { id: '2', name: 'Event 2', slug: 'event-2' },
    ];
    const mockEventsWithRelations = [
      { id: '1', name: 'Event 1', slug: 'event-1', photos: [], categories: [] },
      { id: '2', name: 'Event 2', slug: 'event-2', photos: [], categories: [] },
    ];

    (nativeDB.findEvents as jest.Mock).mockResolvedValue(mockEvents);
    (nativeDB.getEventWithRelations as jest.Mock)
      .mockResolvedValueOnce(mockEventsWithRelations[0])
      .mockResolvedValueOnce(mockEventsWithRelations[1]);

    const request = new NextRequest('http://localhost:3000/api/events');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('Event 1');
  });

  it('should filter events by published status', async () => {
    (nativeDB.findEvents as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/events?published=true');
    await GET(request);

    expect(nativeDB.findEvents).toHaveBeenCalledWith(
      expect.objectContaining({ published: true })
    );
  });

  it('should filter events by featured flag', async () => {
    (nativeDB.findEvents as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/events?featured=true');
    await GET(request);

    expect(nativeDB.findEvents).toHaveBeenCalledWith(
      expect.objectContaining({ featured: true })
    );
  });

  it('should filter events by category', async () => {
    (nativeDB.findEvents as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/events?category=sports');
    await GET(request);

    expect(nativeDB.findEvents).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'sports' })
    );
  });

  it('should support pagination', async () => {
    (nativeDB.findEvents as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/events?take=5&skip=10');
    await GET(request);

    expect(nativeDB.findEvents).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5, skip: 10 })
    );
  });

  it('should return 429 when rate limited', async () => {
    (rateLimit as jest.Mock).mockReturnValue({ allowed: false, retryAfter: 30 });

    const request = new NextRequest('http://localhost:3000/api/events');
    const response = await GET(request);

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
  });

  it('should set cache headers', async () => {
    (nativeDB.findEvents as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/events');
    const response = await GET(request);

    expect(response.headers.get('Cache-Control')).toContain('s-maxage=120');
  });

  it('should handle errors gracefully', async () => {
    (nativeDB.findEvents as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/events');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Database error');
  });
});

describe('POST /api/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Event' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 401 when user is not admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const request = new NextRequest('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Event' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 400 when event name is missing', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });

    const request = new NextRequest('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Test description' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Event name is required');
  });

  it('should return 409 when event slug already exists', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    (nativeDB.findEventBySlug as jest.Mock).mockResolvedValue({ id: 'existing' });

    const request = new NextRequest('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Event' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toBe('An event with this name already exists');
  });

  it('should create event successfully', async () => {
    const mockEvent = { id: 'event-1', name: 'Test Event', slug: 'test-event' };
    const mockEventWithRelations = { ...mockEvent, photos: [], categories: [] };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    (nativeDB.findEventBySlug as jest.Mock).mockResolvedValue(null);
    (nativeDB.createEvent as jest.Mock).mockResolvedValue(mockEvent);
    (nativeDB.getEventWithRelations as jest.Mock).mockResolvedValue(mockEventWithRelations);

    const request = new NextRequest('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Event',
        description: 'A test event',
        date: '2025-01-01',
        location: 'Test Location',
        published: true,
        featured: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe('Test Event');
    expect(nativeDB.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Event',
        slug: 'test-event',
        description: 'A test event',
        published: true,
        featured: false,
        authorId: 'user-1',
      })
    );
  });

  it('should generate correct slug from event name', async () => {
    const mockEvent = { id: 'event-1', name: 'My Test Event!', slug: 'my-test-event' };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    (nativeDB.findEventBySlug as jest.Mock).mockResolvedValue(null);
    (nativeDB.createEvent as jest.Mock).mockResolvedValue(mockEvent);
    (nativeDB.getEventWithRelations as jest.Mock).mockResolvedValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'My Test Event!' }),
    });

    await POST(request);

    expect(nativeDB.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'my-test-event' })
    );
  });

  it('should link categories, photos, and articles when provided', async () => {
    const mockEvent = { id: 'event-1', name: 'Test Event', slug: 'test-event' };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    (nativeDB.findEventBySlug as jest.Mock).mockResolvedValue(null);
    (nativeDB.createEvent as jest.Mock).mockResolvedValue(mockEvent);
    (nativeDB.getEventWithRelations as jest.Mock).mockResolvedValue(mockEvent);
    (nativeDB.linkEventToCategories as jest.Mock).mockResolvedValue(undefined);
    (nativeDB.linkEventToPhotos as jest.Mock).mockResolvedValue(undefined);
    (nativeDB.linkEventToArticles as jest.Mock).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Event',
        categoryIds: ['cat-1', 'cat-2'],
        photoIds: ['photo-1'],
        articleIds: ['article-1'],
      }),
    });

    await POST(request);

    expect(nativeDB.linkEventToCategories).toHaveBeenCalledWith('event-1', ['cat-1', 'cat-2']);
    expect(nativeDB.linkEventToPhotos).toHaveBeenCalledWith('event-1', ['photo-1']);
    expect(nativeDB.linkEventToArticles).toHaveBeenCalledWith('event-1', ['article-1']);
  });

  it('should handle creation errors gracefully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    });
    (nativeDB.findEventBySlug as jest.Mock).mockResolvedValue(null);
    (nativeDB.createEvent as jest.Mock).mockRejectedValue(new Error('Creation failed'));

    const request = new NextRequest('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Event' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Creation failed');
  });
});

