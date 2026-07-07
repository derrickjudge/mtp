/**
 * Database SSL Configuration Tests
 * @jest-environment node
 */

import { buildSslConfig } from '@/lib/dbSsl';

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
    const config = buildSslConfig('postgresql://u:p@host:5432/db?sslmode=require');
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
