/**
 * Settings API Route Tests
 *
 * GET is admin-only except for a small allowlist of public-safe single-key
 * lookups (e.g. the site logo, read by the public nav for every visitor).
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/settings/route';

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/db-native', () => ({
  nativeDB: {
    getSetting: jest.fn(),
    getSettingsByPrefix: jest.fn(),
    getAllSettings: jest.fn(),
    upsertSetting: jest.fn(),
    deleteSetting: jest.fn(),
  },
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true })),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

import { getServerSession } from 'next-auth';
import { nativeDB } from '@/lib/db-native';
import { rateLimit } from '@/lib/rateLimit';

const getRequest = (query: string) => new NextRequest(`http://localhost:3000/api/settings${query}`);

describe('GET /api/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
    (getServerSession as jest.Mock).mockResolvedValue(null);
  });

  it('allows an unauthenticated request to read the public site:logo key', async () => {
    (nativeDB.getSetting as jest.Mock).mockResolvedValue({ key: 'site:logo', value: 'https://cdn/logo.png' });

    const response = await GET(getRequest('?key=site:logo'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.value).toBe('https://cdn/logo.png');
    expect(getServerSession).not.toHaveBeenCalled();
  });

  it('returns 404 for an unauthenticated request to a public key that has no value set', async () => {
    (nativeDB.getSetting as jest.Mock).mockResolvedValue(null);

    const response = await GET(getRequest('?key=site:logo'));
    expect(response.status).toBe(404);
  });

  it('returns 401 for an unauthenticated request to any other single key', async () => {
    const response = await GET(getRequest('?key=some:internal-setting'));

    expect(response.status).toBe(401);
    expect(nativeDB.getSetting).not.toHaveBeenCalled();
  });

  it('returns 401 for an unauthenticated prefix (bulk) request even if it would match a public key', async () => {
    const response = await GET(getRequest('?prefix=site:'));

    expect(response.status).toBe(401);
    expect(nativeDB.getSettingsByPrefix).not.toHaveBeenCalled();
  });

  it('returns 401 for an unauthenticated request for all settings', async () => {
    const response = await GET(getRequest(''));

    expect(response.status).toBe(401);
    expect(nativeDB.getAllSettings).not.toHaveBeenCalled();
  });

  it('allows an authenticated admin to read any key, prefix, or the full list', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (nativeDB.getAllSettings as jest.Mock).mockResolvedValue([{ key: 'a', value: '1' }]);

    const response = await GET(getRequest(''));
    expect(response.status).toBe(200);
  });

  it('returns 429 when rate limited, even for the public key', async () => {
    (rateLimit as jest.Mock).mockReturnValue({ allowed: false, retryAfter: 10 });

    const response = await GET(getRequest('?key=site:logo'));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('10');
  });
});

describe('PUT /api/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
  });

  it('still requires admin auth, including for the public logo key', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await PUT(
      new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'site:logo', value: 'https://cdn/new-logo.png' }),
      })
    );

    expect(response.status).toBe(401);
    expect(nativeDB.upsertSetting).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
  });

  it('still requires admin auth, including for the public logo key', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/settings?key=site:logo', { method: 'DELETE' })
    );

    expect(response.status).toBe(401);
    expect(nativeDB.deleteSetting).not.toHaveBeenCalled();
  });
});
