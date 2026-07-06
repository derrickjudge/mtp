/**
 * Auth Configuration Tests
 *
 * Tests the credentials provider's authorize() flow, including
 * brute-force rate limiting of login attempts.
 * @jest-environment node
 */

import { authOptions } from '@/lib/auth';

jest.mock('@/lib/db-native', () => ({
  nativeDB: {
    findUserByEmail: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

import { nativeDB } from '@/lib/db-native';
import bcrypt from 'bcryptjs';
import { bucketCount } from '@/lib/rateLimit';

type AuthorizeFn = (
  credentials: Record<'email' | 'password', string> | undefined,
  req: { headers?: Record<string, string> }
) => Promise<{ id: string; email: string } | null>;

// CredentialsProvider stores the user-supplied config under `options`.
const provider = authOptions.providers[0] as unknown as {
  options: { authorize: AuthorizeFn };
};
const authorize = provider.options.authorize;

const mockUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin',
  password: 'hashed-password',
  role: 'ADMIN',
};

/** Build a unique request per test so rate-limit buckets do not collide. */
function requestFromIp(ip: string): { headers: Record<string, string> } {
  return { headers: { 'x-real-ip': ip } };
}

describe('authorize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (nativeDB.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('should return the user for valid credentials', async () => {
    const user = await authorize(
      { email: 'valid-login@example.com', password: 'correct' },
      requestFromIp('10.1.0.1')
    );

    expect(user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
    });
  });

  it('should reject invalid passwords', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      authorize({ email: 'bad-password@example.com', password: 'wrong' }, requestFromIp('10.1.0.2'))
    ).rejects.toThrow('Invalid credentials');
  });

  it('should reject missing credentials', async () => {
    await expect(authorize(undefined, requestFromIp('10.1.0.3'))).rejects.toThrow(
      'Invalid credentials'
    );
  });

  it('should throttle repeated attempts for the same email and IP', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const credentials = { email: 'brute-force@example.com', password: 'wrong' };
    const req = requestFromIp('10.1.0.4');

    // First 5 attempts fail with the normal error
    for (let i = 0; i < 5; i++) {
      await expect(authorize(credentials, req)).rejects.toThrow('Invalid credentials');
    }

    // 6th attempt is throttled even if the password would now be correct
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    await expect(authorize(credentials, req)).rejects.toThrow(/too many login attempts/i);
    expect(nativeDB.findUserByEmail).toHaveBeenCalledTimes(5);
  });

  it('should not create per-account buckets once the IP is already blocked', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const req = requestFromIp('10.9.9.9');

    // Exhaust the per-IP limit (20/window) using unique emails.
    for (let i = 0; i < 20; i++) {
      await expect(
        authorize({ email: `flood-${i}@example.com`, password: 'x' }, req)
      ).rejects.toThrow(/invalid credentials|too many login attempts/i);
    }

    const countAfterExhaustion = bucketCount();

    // Further attempts with unique emails must be short-circuited by the IP
    // limiter before the per-account limiter runs, so no new buckets appear.
    for (let i = 0; i < 100; i++) {
      await expect(
        authorize({ email: `flood-again-${i}@example.com`, password: 'x' }, req)
      ).rejects.toThrow(/too many login attempts/i);
    }

    expect(bucketCount()).toBe(countAfterExhaustion);
  });

  it('should not throttle a different IP for the same email', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const credentials = { email: 'shared-target@example.com', password: 'wrong' };

    for (let i = 0; i < 5; i++) {
      await expect(authorize(credentials, requestFromIp('10.1.0.5'))).rejects.toThrow(
        'Invalid credentials'
      );
    }

    // A different IP still gets the normal (non-throttled) error path
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const user = await authorize(credentials, requestFromIp('10.1.0.6'));
    expect(user).not.toBeNull();
  });
});
