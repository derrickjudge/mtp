type RateLimitKey = string;

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<RateLimitKey, Bucket>();

export interface RateLimitOptions {
  tokens: number; // max tokens per window
  windowMs: number; // refill window in ms
}

export function rateLimit(key: RateLimitKey, options: RateLimitOptions) {
  const now = Date.now();
  const bucket = buckets.get(key) || { tokens: options.tokens, lastRefill: now };

  // Refill
  const elapsed = now - bucket.lastRefill;
  if (elapsed >= options.windowMs) {
    bucket.tokens = options.tokens;
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    const retryAfter = Math.max(1, Math.ceil((bucket.lastRefill + options.windowMs - now) / 1000));
    return { allowed: false, retryAfter };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { allowed: true };
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


