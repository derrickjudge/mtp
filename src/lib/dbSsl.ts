// TLS configuration for the native Postgres client.
//
// By default the connection encrypts but does not authenticate the server
// certificate (`rejectUnauthorized: false`), which leaves it open to
// man-in-the-middle attacks. To verify the server, provide the provider's CA
// certificate (Supabase offers a downloadable CA cert) via either:
//   - DATABASE_CA_CERT       — the PEM contents inline, or
//   - DATABASE_CA_CERT_PATH  — a path to a .crt/.pem file on disk.
// When a cert is available the connection requires a valid certificate.

import { readFileSync } from 'fs';

export type SslConfig = false | { rejectUnauthorized: boolean; ca?: string };

let cachedCaCert: string | undefined;
let caCertResolved = false;

/**
 * Resolve the CA certificate from the environment, preferring the inline
 * DATABASE_CA_CERT over the DATABASE_CA_CERT_PATH file. The result (including
 * "no cert") is cached, so the file is read at most once per process.
 *
 * @returns The trimmed PEM contents, or undefined when no cert is configured or
 *   the configured file cannot be read.
 */
export function resolveCaCert(): string | undefined {
  if (caCertResolved) {
    return cachedCaCert;
  }

  const inline = process.env.DATABASE_CA_CERT?.trim();
  if (inline) {
    cachedCaCert = inline;
  } else {
    const certPath = process.env.DATABASE_CA_CERT_PATH?.trim();
    if (certPath) {
      try {
        cachedCaCert = readFileSync(certPath, 'utf8').trim() || undefined;
      } catch (error) {
        console.error(`Failed to read DATABASE_CA_CERT_PATH (${certPath}):`, error);
        cachedCaCert = undefined;
      }
    } else {
      cachedCaCert = undefined;
    }
  }

  caCertResolved = true;
  return cachedCaCert;
}

/** Reset the cached CA certificate. Intended for tests. */
export function resetCaCertCache(): void {
  caCertResolved = false;
  cachedCaCert = undefined;
}

/**
 * Derive the pg SSL config from the connection URL and a CA certificate.
 *
 * @param baseUrl The Postgres connection string.
 * @param caCert Optional CA certificate (PEM). Defaults to the resolved
 *   DATABASE_CA_CERT / DATABASE_CA_CERT_PATH value.
 * @returns `false` when SSL is disabled; otherwise a pg SSL options object that
 *   verifies the server certificate when a CA cert is available.
 */
export function buildSslConfig(
  baseUrl: string,
  caCert: string | undefined = resolveCaCert()
): SslConfig {
  const url = new URL(baseUrl);
  if (url.searchParams.get('sslmode') === 'disable') {
    return false;
  }

  const trimmedCa = caCert?.trim();
  if (trimmedCa) {
    return { ca: trimmedCa, rejectUnauthorized: true };
  }

  // No CA available: encrypt but cannot verify the server certificate.
  return { rejectUnauthorized: false };
}
