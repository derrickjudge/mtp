// TLS configuration for the native Postgres client.
//
// By default the connection encrypts but does not authenticate the server
// certificate (`rejectUnauthorized: false`), which leaves it open to
// man-in-the-middle attacks. To verify the server, set the DATABASE_CA_CERT
// environment variable to the provider's CA certificate (Supabase provides a
// downloadable CA cert); the connection then requires a valid certificate.

export type SslConfig = false | { rejectUnauthorized: boolean; ca?: string };

/**
 * Derive the pg SSL config from the connection URL and optional CA certificate.
 *
 * @param baseUrl The Postgres connection string.
 * @param caCert Optional CA certificate (PEM). Defaults to DATABASE_CA_CERT.
 * @returns `false` when SSL is disabled; otherwise a pg SSL options object that
 *   verifies the server certificate when a CA cert is available.
 */
export function buildSslConfig(
  baseUrl: string,
  caCert: string | undefined = process.env.DATABASE_CA_CERT
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
