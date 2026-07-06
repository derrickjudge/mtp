type RateLimitKey = string;

interface Bucket {
  tokens: number;
  lastRefill: number;
  expiresAt: number; // lastRefill + windowMs; bucket is inert once passed
}

const buckets = new Map<RateLimitKey, Bucket>();

// Bound memory against unbounded/adversarial unique-key growth. Buckets are an
// in-memory Map with no external backing, so they must be evicted or they leak.
const MAX_BUCKETS = 10_000;
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = Date.now();

export interface RateLimitOptions {
  tokens: number; // max tokens per window
  windowMs: number; // refill window in ms
}

// An expired bucket (window fully elapsed) holds no state that differs from a
// freshly created one, so deleting it never changes rate-limiting behavior.
function sweepExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.expiresAt) {
      buckets.delete(key);
    }
  }
  lastSweep = now;
}

// Backstop for a burst of unique keys within a single sweep interval. Map
// preserves insertion order, so this evicts the oldest keys first (FIFO).
function enforceMaxSize(): void {
  while (buckets.size > MAX_BUCKETS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}

export function rateLimit(key: RateLimitKey, options: RateLimitOptions) {
  const now = Date.now();

  // Amortized sweep so buckets that are never touched again still get reclaimed.
  if (now - lastSweep >= SWEEP_INTERVAL_MS) {
    sweepExpired(now);
  }

  let bucket = buckets.get(key);
  // Treat an expired bucket as absent so its window resets cleanly.
  if (bucket && now >= bucket.expiresAt) {
    bucket = undefined;
  }
  if (!bucket) {
    bucket = { tokens: options.tokens, lastRefill: now, expiresAt: now + options.windowMs };
  }

  // Refill
  const elapsed = now - bucket.lastRefill;
  if (elapsed >= options.windowMs) {
    bucket.tokens = options.tokens;
    bucket.lastRefill = now;
    bucket.expiresAt = now + options.windowMs;
  }

  if (bucket.tokens <= 0) {
    buckets.set(key, bucket);
    const retryAfter = Math.max(1, Math.ceil((bucket.lastRefill + options.windowMs - now) / 1000));
    return { allowed: false, retryAfter };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  enforceMaxSize();
  return { allowed: true };
}

// Introspection for tests and monitoring; not part of the rate-limit contract.
export function bucketCount(): number {
  return buckets.size;
}

// x-real-ip is set by the hosting platform (Vercel) and cannot be spoofed by
// the client, unlike the leftmost x-forwarded-for entry, so prefer it.
export function getClientIp(req: Request | { headers: Headers }): string {
  const headers = req.headers;
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

// Same extraction for plain header records (e.g. NextAuth's authorize() request).
export function getClientIpFromRecord(
  headers: Record<string, string | string[] | undefined>
): string {
  const headerValue = (value: string | string[] | undefined): string | undefined => {
    const raw = Array.isArray(value) ? value[0] : value;
    const trimmed = raw?.trim();
    return trimmed || undefined;
  };
  const realIp = headerValue(headers['x-real-ip']);
  if (realIp) return realIp;
  const forwarded = headerValue(headers['x-forwarded-for']);
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}


