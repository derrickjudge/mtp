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

export function getClientIp(req: Request | { headers: Headers }): string {
  const headers = req instanceof Request ? req.headers : req.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}


