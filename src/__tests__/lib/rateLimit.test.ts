/**
 * Rate Limiting Utility Tests
 * 
 * Tests the token bucket algorithm implementation for API rate limiting.
 */

import { rateLimit, getClientIp } from '@/lib/rateLimit';

describe('rateLimit', () => {
  beforeEach(() => {
    // Reset the rate limit buckets between tests by using unique keys
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should allow requests within the token limit', () => {
    const key = `test-allow-${Date.now()}`;
    const options = { tokens: 5, windowMs: 60000 };

    // First 5 requests should be allowed
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(key, options);
      expect(result.allowed).toBe(true);
    }
  });

  it('should deny requests after token limit is exceeded', () => {
    const key = `test-deny-${Date.now()}`;
    const options = { tokens: 3, windowMs: 60000 };

    // Use up all tokens
    for (let i = 0; i < 3; i++) {
      rateLimit(key, options);
    }

    // Next request should be denied
    const result = rateLimit(key, options);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeDefined();
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should refill tokens after window expires', () => {
    const key = `test-refill-${Date.now()}`;
    const options = { tokens: 2, windowMs: 1000 }; // 1 second window

    // Use all tokens
    rateLimit(key, options);
    rateLimit(key, options);

    // Should be denied
    let result = rateLimit(key, options);
    expect(result.allowed).toBe(false);

    // Advance time past the window
    jest.advanceTimersByTime(1001);

    // Should be allowed again after refill
    result = rateLimit(key, options);
    expect(result.allowed).toBe(true);
  });

  it('should maintain separate buckets for different keys', () => {
    const key1 = `test-key1-${Date.now()}`;
    const key2 = `test-key2-${Date.now()}`;
    const options = { tokens: 1, windowMs: 60000 };

    // Use up key1's token
    rateLimit(key1, options);
    
    // key1 should be denied
    expect(rateLimit(key1, options).allowed).toBe(false);
    
    // key2 should still be allowed (separate bucket)
    expect(rateLimit(key2, options).allowed).toBe(true);
  });

  it('should calculate correct retryAfter value', () => {
    const key = `test-retry-${Date.now()}`;
    const options = { tokens: 1, windowMs: 30000 }; // 30 second window

    // Use up the token
    rateLimit(key, options);

    // Advance 10 seconds
    jest.advanceTimersByTime(10000);

    // Should have ~20 seconds remaining
    const result = rateLimit(key, options);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThanOrEqual(19);
    expect(result.retryAfter).toBeLessThanOrEqual(21);
  });
});

describe('getClientIp', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const headers = new Headers();
    headers.set('x-forwarded-for', '192.168.1.1, 10.0.0.1');
    
    const ip = getClientIp({ headers });
    expect(ip).toBe('192.168.1.1');
  });

  it('should extract IP from x-real-ip header when x-forwarded-for is missing', () => {
    const headers = new Headers();
    headers.set('x-real-ip', '10.0.0.5');
    
    const ip = getClientIp({ headers });
    expect(ip).toBe('10.0.0.5');
  });

  it('should return "unknown" when no IP headers are present', () => {
    const headers = new Headers();
    
    const ip = getClientIp({ headers });
    expect(ip).toBe('unknown');
  });

  it('should prefer x-forwarded-for over x-real-ip', () => {
    const headers = new Headers();
    headers.set('x-forwarded-for', '192.168.1.1');
    headers.set('x-real-ip', '10.0.0.5');
    
    const ip = getClientIp({ headers });
    expect(ip).toBe('192.168.1.1');
  });

  it('should trim whitespace from IP addresses', () => {
    const headers = new Headers();
    headers.set('x-forwarded-for', '  192.168.1.1  , 10.0.0.1');
    
    const ip = getClientIp({ headers });
    expect(ip).toBe('192.168.1.1');
  });
});

