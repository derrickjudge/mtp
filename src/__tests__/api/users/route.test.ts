/**
 * Users API Route Tests
 *
 * Tests for GET /api/users and POST /api/users endpoints.
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/users/route';

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/db-native', () => ({
  nativeDB: {
    findUsers: jest.fn(),
    findUserByEmail: jest.fn(),
    createUser: jest.fn(),
  },
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true })),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

import { getServerSession } from 'next-auth';
import { nativeDB } from '@/lib/db-native';
import { rateLimit } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';

const adminSession = { user: { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' } };

describe('GET /api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
    (getServerSession as jest.Mock).mockResolvedValue(adminSession);
  });

  it('returns 401 when not an admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', role: 'USER' } });

    const request = new NextRequest('http://localhost:3000/api/users');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns users including createdAt/updatedAt for the admin list view', async () => {
    (nativeDB.findUsers as jest.Mock).mockResolvedValue([
      {
        id: 'u1',
        email: 'a@example.com',
        name: null,
        role: 'USER',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const request = new NextRequest('http://localhost:3000/api/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0]).toMatchObject({
      id: 'u1',
      email: 'a@example.com',
      role: 'USER',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('returns 429 when rate limited', async () => {
    (rateLimit as jest.Mock).mockReturnValue({ allowed: false, retryAfter: 15 });

    const request = new NextRequest('http://localhost:3000/api/users');
    const response = await GET(request);

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('15');
  });
});

describe('POST /api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
    (getServerSession as jest.Mock).mockResolvedValue(adminSession);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  const postRequest = (body: unknown) =>
    new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('returns 401 when not an admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', role: 'USER' } });

    const response = await POST(postRequest({ email: 'new@example.com', password: 'longenough', role: 'USER' }));

    expect(response.status).toBe(401);
    expect(nativeDB.createUser).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid email', async () => {
    const response = await POST(postRequest({ email: 'not-an-email', password: 'longenough', role: 'USER' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toMatch(/valid/i);
  });

  it('returns 400 for a too-short password', async () => {
    const response = await POST(postRequest({ email: 'new@example.com', password: 'short', role: 'USER' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toMatch(/8 characters/i);
  });

  it('returns 400 for an invalid role', async () => {
    const response = await POST(
      postRequest({ email: 'new@example.com', password: 'longenough', role: 'SUPERUSER' })
    );

    expect(response.status).toBe(400);
  });

  it('returns 409 when the email is already taken', async () => {
    (nativeDB.findUserByEmail as jest.Mock).mockResolvedValue({ id: 'existing-1' });

    const response = await POST(postRequest({ email: 'new@example.com', password: 'longenough', role: 'USER' }));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toMatch(/already/i);
    expect(nativeDB.createUser).not.toHaveBeenCalled();
  });

  it('hashes the password and creates the user', async () => {
    (nativeDB.findUserByEmail as jest.Mock).mockResolvedValue(null);
    (nativeDB.createUser as jest.Mock).mockResolvedValue({
      id: 'new-1',
      email: 'new@example.com',
      name: null,
      role: 'USER',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const response = await POST(postRequest({ email: 'new@example.com', password: 'longenough', role: 'USER' }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(bcrypt.hash).toHaveBeenCalledWith('longenough', 12);
    expect(nativeDB.createUser).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'hashed-password',
      name: undefined,
      role: 'USER',
    });
    expect(data).not.toHaveProperty('password');
    expect(data.id).toBe('new-1');
  });

  it('defaults role to USER when omitted', async () => {
    (nativeDB.findUserByEmail as jest.Mock).mockResolvedValue(null);
    (nativeDB.createUser as jest.Mock).mockResolvedValue({
      id: 'new-1',
      email: 'new@example.com',
      role: 'USER',
    });

    await POST(postRequest({ email: 'new@example.com', password: 'longenough' }));

    expect(nativeDB.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'USER' })
    );
  });

  it('returns 429 when rate limited', async () => {
    (rateLimit as jest.Mock).mockReturnValue({ allowed: false, retryAfter: 20 });

    const response = await POST(postRequest({ email: 'new@example.com', password: 'longenough', role: 'USER' }));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('20');
  });

  it('handles database errors gracefully', async () => {
    (nativeDB.findUserByEmail as jest.Mock).mockResolvedValue(null);
    (nativeDB.createUser as jest.Mock).mockRejectedValue(new Error('DB down'));

    const response = await POST(postRequest({ email: 'new@example.com', password: 'longenough', role: 'USER' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Failed to create user');
  });
});
