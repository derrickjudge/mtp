/**
 * Database SSL Configuration Tests
 * @jest-environment node
 */

import { readFileSync } from 'fs';
import { buildSslConfig, resolveCaCert, resetCaCertCache } from '@/lib/dbSsl';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

const CA = '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----';

describe('buildSslConfig', () => {
  it('disables SSL when sslmode=disable', () => {
    expect(buildSslConfig('postgresql://u:p@host:5432/db?sslmode=disable')).toBe(false);
  });

  it('verifies the server certificate when a CA cert is provided', () => {
    const config = buildSslConfig('postgresql://u:p@host:5432/db?sslmode=require', CA);
    expect(config).toEqual({ ca: CA, rejectUnauthorized: true });
  });

  it('verifies even without an explicit sslmode when a CA cert is provided', () => {
    const config = buildSslConfig('postgresql://u:p@host:5432/db', CA);
    expect(config).toEqual({ ca: CA, rejectUnauthorized: true });
  });

  it('falls back to unverified TLS when no CA cert is available', () => {
    const config = buildSslConfig('postgresql://u:p@host:5432/db?sslmode=require', undefined);
    expect(config).toEqual({ rejectUnauthorized: false });
  });

  it('treats an empty CA cert as absent', () => {
    const config = buildSslConfig('postgresql://u:p@host:5432/db', '   ');
    expect(config).toEqual({ rejectUnauthorized: false });
  });

  it('does not verify against a CA when SSL is disabled, even if a cert is set', () => {
    expect(buildSslConfig('postgresql://u:p@host:5432/db?sslmode=disable', CA)).toBe(false);
  });
});

describe('resolveCaCert', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetCaCertCache();
    (readFileSync as jest.Mock).mockReset();
    delete process.env.DATABASE_CA_CERT;
    delete process.env.DATABASE_CA_CERT_PATH;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns undefined when neither variable is set', () => {
    expect(resolveCaCert()).toBeUndefined();
    expect(readFileSync).not.toHaveBeenCalled();
  });

  it('returns the inline PEM from DATABASE_CA_CERT', () => {
    process.env.DATABASE_CA_CERT = CA;
    expect(resolveCaCert()).toBe(CA);
    expect(readFileSync).not.toHaveBeenCalled();
  });

  it('reads the file named by DATABASE_CA_CERT_PATH', () => {
    process.env.DATABASE_CA_CERT_PATH = '/certs/supabase.crt';
    (readFileSync as jest.Mock).mockReturnValue(`${CA}\n`);

    expect(resolveCaCert()).toBe(CA);
    expect(readFileSync).toHaveBeenCalledWith('/certs/supabase.crt', 'utf8');
  });

  it('prefers the inline PEM over the file path when both are set', () => {
    process.env.DATABASE_CA_CERT = CA;
    process.env.DATABASE_CA_CERT_PATH = '/certs/supabase.crt';

    expect(resolveCaCert()).toBe(CA);
    expect(readFileSync).not.toHaveBeenCalled();
  });

  it('returns undefined and does not throw when the file cannot be read', () => {
    process.env.DATABASE_CA_CERT_PATH = '/nope/missing.crt';
    (readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('ENOENT');
    });

    expect(resolveCaCert()).toBeUndefined();
  });

  it('caches the result so the file is read only once', () => {
    process.env.DATABASE_CA_CERT_PATH = '/certs/supabase.crt';
    (readFileSync as jest.Mock).mockReturnValue(CA);

    resolveCaCert();
    resolveCaCert();

    expect(readFileSync).toHaveBeenCalledTimes(1);
  });

  it('is used as the default source for buildSslConfig', () => {
    process.env.DATABASE_CA_CERT_PATH = '/certs/supabase.crt';
    (readFileSync as jest.Mock).mockReturnValue(CA);

    const config = buildSslConfig('postgresql://u:p@host:5432/db?sslmode=require');
    expect(config).toEqual({ ca: CA, rejectUnauthorized: true });
  });
});
