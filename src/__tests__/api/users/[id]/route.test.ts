/**
 * Users [id] API Route Tests
 *
 * Tests for PUT /api/users/[id] and DELETE /api/users/[id] endpoints.
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { PUT, DELETE } from '@/app/api/users/[id]/route';

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/db-native', () => ({
  nativeDB: {
    findUserById: jest.fn(),
    findUserByEmail: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
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

const targetUser = {
  id: 'target-1',
  email: 'target@example.com',
  name: null,
  role: 'USER',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('PUT /api/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
    (getServerSession as jest.Mock).mockResolvedValue(adminSession);
    (nativeDB.findUserById as jest.Mock).mockResolvedValue(targetUser);
    (nativeDB.findUserByEmail as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  const putRequest = (body: unknown) =>
    new NextRequest('http://localhost:3000/api/users/target-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const call = (body: unknown, id = 'target-1') => PUT(putRequest(body), { params: { id } });

  it('returns 401 when not an admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', role: 'USER' } });

    const response = await call({ email: 'target@example.com', role: 'USER' });

    expect(response.status).toBe(401);
    expect(nativeDB.updateUser).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid email', async () => {
    const response = await call({ email: 'not-an-email', role: 'USER' });
    expect(response.status).toBe(400);
  });

  it('returns 400 for an invalid role', async () => {
    const response = await call({ email: 'target@example.com', role: 'SUPERUSER' });
    expect(response.status).toBe(400);
  });

  it('returns 404 when the target user does not exist', async () => {
    (nativeDB.findUserById as jest.Mock).mockResolvedValue(null);

    const response = await call({ email: 'target@example.com', role: 'USER' }, 'missing-1');
    expect(response.status).toBe(404);
  });

  it('returns 409 when the email is already taken by another user', async () => {
    (nativeDB.findUserByEmail as jest.Mock).mockResolvedValue({ id: 'someone-else' });

    const response = await call({ email: 'taken@example.com', role: 'USER' });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toMatch(/already/i);
  });

  it('allows keeping the same email on the same user', async () => {
    (nativeDB.findUserByEmail as jest.Mock).mockResolvedValue(targetUser);
    (nativeDB.updateUser as jest.Mock).mockResolvedValue(targetUser);

    const response = await call({ email: 'target@example.com', role: 'USER' });
    expect(response.status).toBe(200);
  });

  it('blocks an admin from demoting their own account', async () => {
    (nativeDB.findUserById as jest.Mock).mockResolvedValue({ ...targetUser, id: 'admin-1', role: 'ADMIN' });

    const response = await call({ email: 'admin@example.com', role: 'USER' }, 'admin-1');
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toMatch(/own admin/i);
    expect(nativeDB.updateUser).not.toHaveBeenCalled();
  });

  it('returns 400 for a too-short password when changing it', async () => {
    const response = await call({ email: 'target@example.com', role: 'USER', password: 'short' });
    expect(response.status).toBe(400);
  });

  it('updates a user without changing the password', async () => {
    (nativeDB.updateUser as jest.Mock).mockResolvedValue({ ...targetUser, role: 'EDITOR' });

    const response = await call({ email: 'target@example.com', role: 'EDITOR' });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(nativeDB.updateUser).toHaveBeenCalledWith('target-1', {
      email: 'target@example.com',
      name: undefined,
      role: 'EDITOR',
      password: undefined,
    });
    expect(data).not.toHaveProperty('password');
  });

  it('hashes and updates the password when provided', async () => {
    (nativeDB.updateUser as jest.Mock).mockResolvedValue(targetUser);

    await call({ email: 'target@example.com', role: 'USER', password: 'newlongpassword' });

    expect(bcrypt.hash).toHaveBeenCalledWith('newlongpassword', 12);
    expect(nativeDB.updateUser).toHaveBeenCalledWith('target-1', {
      email: 'target@example.com',
      name: undefined,
      role: 'USER',
      password: 'hashed-password',
    });
  });

  it('returns 429 when rate limited', async () => {
    (rateLimit as jest.Mock).mockReturnValue({ allowed: false, retryAfter: 12 });

    const response = await call({ email: 'target@example.com', role: 'USER' });
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('12');
  });

  it('handles database errors gracefully', async () => {
    (nativeDB.updateUser as jest.Mock).mockRejectedValue(new Error('DB down'));

    const response = await call({ email: 'target@example.com', role: 'USER' });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Failed to update user');
  });
});

describe('DELETE /api/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
    (getServerSession as jest.Mock).mockResolvedValue(adminSession);
    (nativeDB.findUserById as jest.Mock).mockResolvedValue(targetUser);
    (nativeDB.deleteUser as jest.Mock).mockResolvedValue(true);
  });

  const call = (id: string) =>
    DELETE(new NextRequest(`http://localhost:3000/api/users/${id}`, { method: 'DELETE' }), { params: { id } });

  it('returns 401 when not an admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', role: 'USER' } });

    const response = await call('target-1');
    expect(response.status).toBe(401);
    expect(nativeDB.deleteUser).not.toHaveBeenCalled();
  });

  it('returns 404 when the target user does not exist', async () => {
    (nativeDB.findUserById as jest.Mock).mockResolvedValue(null);

    const response = await call('missing-1');
    expect(response.status).toBe(404);
  });

  it('blocks an admin from deleting their own account', async () => {
    (nativeDB.findUserById as jest.Mock).mockResolvedValue({ ...targetUser, id: 'admin-1' });

    const response = await call('admin-1');
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toMatch(/own account/i);
    expect(nativeDB.deleteUser).not.toHaveBeenCalled();
  });

  it('deletes the user', async () => {
    const response = await call('target-1');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(nativeDB.deleteUser).toHaveBeenCalledWith('target-1');
    expect(data.message).toMatch(/deleted/i);
  });

  it('returns 429 when rate limited', async () => {
    (rateLimit as jest.Mock).mockReturnValue({ allowed: false, retryAfter: 8 });

    const response = await call('target-1');
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('8');
  });

  it('handles database errors gracefully', async () => {
    (nativeDB.deleteUser as jest.Mock).mockRejectedValue(new Error('DB down'));

    const response = await call('target-1');
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Failed to delete user');
  });
});
