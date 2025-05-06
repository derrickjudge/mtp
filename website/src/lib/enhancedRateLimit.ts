/**
 * Enhanced Rate Limiting Utility
 * 
 * Provides flexible rate limiting for API routes with support for:
 * - Different rate limit tiers (normal, strict, permissive)
 * - Separate tracking for authenticated and unauthenticated requests
 * - Tracking by IP, user ID, or custom tokens
 * - Different rate limits for successful vs. failed requests
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limit record type
interface RateLimitRecord {
  count: number;
  resetAt: number;
  firstAt: number;
  lastAt: number;
}

// Rate limit configuration
export interface RateLimitConfig {
  // Maximum number of requests allowed in the time window
  maxRequests: number;
  
  // Time window in milliseconds
  windowMs: number;
  
  // Optional separate limit for authenticated requests (if higher than normal)
  authenticatedMaxRequests?: number;
  
  // Optional separate limit for failed requests (typically lower than successful)
  failedMaxRequests?: number;
  
  // Time to block after exceeding failed attempts (ms)
  blockDurationMs?: number;
  
  // How many tokens to keep in memory
  maxKeys?: number;
  
  // Headers and response settings
  headers?: boolean;
  
  // Message to return when rate limited
  message?: string;
  
  // Maximum number of unique tokens per interval (for backward compatibility)
  uniqueTokenPerInterval?: number;
  
  // Function to customize the response
  handler?: (req: NextRequest, key: string, limit: RateLimit) => Promise<NextResponse>;
}

// Default configurations for different protection levels
const RATE_LIMIT_PRESETS = {
  // Normal API endpoints (most routes)
  NORMAL: {
    maxRequests: 60,         // 60 requests
    windowMs: 60 * 1000,     // per minute
    failedMaxRequests: 10,   // 10 failed requests per minute
    blockDurationMs: 60 * 1000, // 1 minute block after too many failures
    maxKeys: 10000,
    headers: true,
    message: 'Too many requests, please try again later.',
  },
  
  // Strict protection for sensitive endpoints (auth, admin)
  STRICT: {
    maxRequests: 30,         // 30 requests
    windowMs: 60 * 1000,     // per minute
    failedMaxRequests: 5,    // 5 failed requests per minute
    blockDurationMs: 5 * 60 * 1000, // 5 minute block after too many failures
    maxKeys: 10000,
    headers: true,
    message: 'Too many attempts, please try again later.',
  },
  
  // Very strict protection (login, password reset)
  VERY_STRICT: {
    maxRequests: 10,         // 10 requests
    windowMs: 60 * 1000,     // per minute
    failedMaxRequests: 3,    // 3 failed requests per minute
    blockDurationMs: 15 * 60 * 1000, // 15 minute block after too many failures
    maxKeys: 10000,
    headers: true,
    message: 'Access temporarily blocked due to too many attempts.',
  },
  
  // Permissive for public, non-sensitive endpoints
  PERMISSIVE: {
    maxRequests: 120,        // 120 requests
    windowMs: 60 * 1000,     // per minute
    failedMaxRequests: 30,   // 30 failed requests per minute
    blockDurationMs: 30 * 1000, // 30 second block after too many failures
    maxKeys: 10000,
    headers: true,
    message: 'Rate limit exceeded, please slow down.',
  }
};

// Store rate limit data (in production, use Redis or similar distributed store)
class RateLimitStore {
  private store: Map<string, RateLimitRecord>;
  private keysByTime: {key: string, expires: number}[];
  private readonly maxKeys: number;
  private lastCleanup: number = Date.now();

  constructor(maxKeys: number = 10000) {
    this.store = new Map<string, RateLimitRecord>();
    this.keysByTime = [];
    this.maxKeys = maxKeys;
  }

  get(key: string): RateLimitRecord | undefined {
    return this.store.get(key);
  }

  set(key: string, record: RateLimitRecord): void {
    // Clean up old records occasionally
    this.cleanup();
    
    // Store the record
    this.store.set(key, record);
    
    // Track expiration for cleanup
    this.keysByTime.push({
      key,
      expires: record.resetAt
    });
    
    // Enforce max keys limit
    if (this.store.size > this.maxKeys) {
      // Sort keys by oldest reset time
      this.keysByTime.sort((a, b) => a.expires - b.expires);
      
      // Remove oldest keys to get under limit
      while (this.store.size > this.maxKeys && this.keysByTime.length > 0) {
        const oldest = this.keysByTime.shift();
        if (oldest) {
          this.store.delete(oldest.key);
        }
      }
    }
  }

  increment(key: string, windowMs: number): RateLimitRecord {
    const now = Date.now();
    const record = this.get(key);
    
    if (!record || now > record.resetAt) {
      // Create new record if none exists or the window has expired
      const newRecord: RateLimitRecord = {
        count: 1,
        resetAt: now + windowMs,
        firstAt: now,
        lastAt: now
      };
      this.set(key, newRecord);
      return newRecord;
    } else {
      // Update existing record
      const updatedRecord: RateLimitRecord = {
        count: record.count + 1,
        resetAt: record.resetAt,
        firstAt: record.firstAt,
        lastAt: now
      };
      this.set(key, updatedRecord);
      return updatedRecord;
    }
  }

  delete(key: string): void {
    this.store.delete(key);
    this.keysByTime = this.keysByTime.filter(item => item.key !== key);
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Only clean up every 5 minutes to avoid performance impact
    if (now - this.lastCleanup < 5 * 60 * 1000) {
      return;
    }
    
    this.lastCleanup = now;
    
    // Remove expired records
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key);
      }
    }
    
    // Update keys by time array
    this.keysByTime = this.keysByTime.filter(item => {
      return item.expires > now && this.store.has(item.key);
    });
  }
}

// Global stores for different types of rate limits
const normalRequestStore = new RateLimitStore();
const failedRequestStore = new RateLimitStore();

export class RateLimit {
  private readonly config: RateLimitConfig;
  private readonly normalStore: RateLimitStore;
  private readonly failedStore: RateLimitStore;

  constructor(config: RateLimitConfig, storeOverride?: { normal: RateLimitStore, failed: RateLimitStore }) {
    this.config = {
      ...RATE_LIMIT_PRESETS.NORMAL,
      ...config
    };
    
    this.normalStore = storeOverride?.normal || normalRequestStore;
    this.failedStore = storeOverride?.failed || failedRequestStore;
  }

  /**
   * Get a unique key for the request
   * @param req The Next.js request
   * @param prefix Optional prefix to differentiate rate limit types
   * @returns A unique key for rate limiting
   */
  private getKey(req: NextRequest, prefix: string = 'rl'): string {
    // Try to get client IP
    let ip = '';
    try {
      const forwardedFor = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      
      if (forwardedFor) {
        ip = forwardedFor.split(',')[0].trim();
      } else if (realIp) {
        ip = realIp.trim();
      } else {
        // Fallback - in production this should be handled better
        ip = '127.0.0.1';
      }
    } catch (e) {
      ip = '127.0.0.1';
    }
    
    // Get the route from the URL
    const route = req.nextUrl.pathname;
    
    // Combine to create a unique key
    return `${prefix}:${ip}:${route}`;
  }

  /**
   * Check if the request is authenticated
   * @param req The Next.js request
   * @returns True if authenticated, false otherwise
   */
  private isAuthenticated(req: NextRequest): boolean {
    // Check for auth token in cookies or authorization header
    const authToken = req.cookies.get('auth_token')?.value;
    const authHeader = req.headers.get('authorization');
    
    return Boolean(authToken || authHeader);
  }

  /**
   * Check if the request should be rate limited
   * @param req The Next.js request
   * @returns Result object with rate limit information
   */
  async check(req: NextRequest): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    blocked: boolean;
  }> {
    const key = this.getKey(req);
    const failedKey = this.getKey(req, 'failed');
    const now = Date.now();
    
    // Check if this IP is in a failed request block period
    const failedRecord = this.failedStore.get(failedKey);
    
    // If there's a record and it exceeded the failed request limit
    if (
      failedRecord &&
      failedRecord.count > (this.config.failedMaxRequests || this.config.maxRequests) &&
      this.config.blockDurationMs &&
      now < failedRecord.lastAt + this.config.blockDurationMs
    ) {
      // Calculate reset time
      const reset = failedRecord.lastAt + (this.config.blockDurationMs || 0);
      
      return {
        success: false,
        limit: this.config.failedMaxRequests || this.config.maxRequests,
        remaining: 0,
        reset,
        blocked: true
      };
    }
    
    // Increment the normal request counter
    const record = this.normalStore.increment(key, this.config.windowMs);
    
    // Get the effective limit based on whether the request is authenticated
    const effectiveLimit = this.isAuthenticated(req) && this.config.authenticatedMaxRequests 
      ? this.config.authenticatedMaxRequests 
      : this.config.maxRequests;
    
    // Check if the limit is exceeded
    const remaining = Math.max(0, effectiveLimit - record.count);
    const success = record.count <= effectiveLimit;
    
    return {
      success,
      limit: effectiveLimit,
      remaining,
      reset: record.resetAt,
      blocked: false
    };
  }

  /**
   * Record a failed request (for tracking excessive failed attempts)
   * @param req The Next.js request
   * @returns Current count of failed requests
   */
  async recordFailure(req: NextRequest): Promise<number> {
    const failedKey = this.getKey(req, 'failed');
    const record = this.failedStore.increment(failedKey, this.config.windowMs);
    return record.count;
  }

  /**
   * Reset failed request count (e.g., after successful authentication)
   * @param req The Next.js request
   */
  async resetFailures(req: NextRequest): Promise<void> {
    const failedKey = this.getKey(req, 'failed');
    this.failedStore.delete(failedKey);
  }

  /**
   * Create a rate-limited response
   * @param req The Next.js request
   * @param info Rate limit info
   * @returns Rate limited response
   */
  async createLimitedResponse(req: NextRequest, info: {
    limit: number;
    remaining: number;
    reset: number;
    blocked: boolean;
  }): Promise<NextResponse> {
    // Use custom handler if provided
    if (this.config.handler) {
      return this.config.handler(req, this.getKey(req), this);
    }
    
    // Create default response
    const response = NextResponse.json(
      {
        success: false,
        message: this.config.message || 'Too many requests',
        retryAfter: Math.ceil((info.reset - Date.now()) / 1000)
      },
      { status: 429 }
    );
    
    // Add rate limit headers if enabled
    if (this.config.headers) {
      response.headers.set('Retry-After', Math.ceil((info.reset - Date.now()) / 1000).toString());
      response.headers.set('X-RateLimit-Limit', info.limit.toString());
      response.headers.set('X-RateLimit-Remaining', info.remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(info.reset / 1000).toString());
    }
    
    return response;
  }
}

/**
 * Create a rate limiter with the specified configuration
 * @param config Rate limiting configuration or preset name
 * @returns RateLimit instance
 */
export function createRateLimit(
  config: RateLimitConfig | 'NORMAL' | 'STRICT' | 'VERY_STRICT' | 'PERMISSIVE' = 'NORMAL'
): RateLimit {
  // If a preset name is provided, use that configuration
  if (typeof config === 'string') {
    return new RateLimit(RATE_LIMIT_PRESETS[config]);
  }
  
  // Otherwise, use the provided configuration
  return new RateLimit(config);
}

/**
 * Rate limiting middleware for API routes
 * @param config Rate limit configuration or preset
 * @returns Middleware function for rate limiting
 */
export function rateLimit(
  config: RateLimitConfig | 'NORMAL' | 'STRICT' | 'VERY_STRICT' | 'PERMISSIVE' = 'NORMAL'
) {
  const limiter = createRateLimit(config);
  
  return async (req: NextRequest) => {
    const result = await limiter.check(req);
    
    if (!result.success) {
      return limiter.createLimitedResponse(req, result);
    }
    
    return null;
  };
}
