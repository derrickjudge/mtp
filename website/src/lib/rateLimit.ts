/**
 * Rate limiting utility for API routes
 */

import { NextRequest } from 'next/server';

// Define LRUCache interface manually to avoid dependency issues
interface LRUCacheOptions {
  max: number;
  ttl: number;
}

// Basic implementation for our needs
class LRUCache {
  private cache: Map<string, any>;
  private ttl: number;
  private max: number;
  private timers: Map<string, NodeJS.Timeout>;

  constructor(options: LRUCacheOptions) {
    this.cache = new Map();
    this.timers = new Map();
    this.ttl = options.ttl;
    this.max = options.max;
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any): void {
    // Clear existing timer if present
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    // Set expiration timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, this.ttl);

    // Store value and timer
    this.cache.set(key, value);
    this.timers.set(key, timer);

    // Evict oldest entries if we're over capacity
    if (this.cache.size > this.max) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      if (this.timers.has(oldestKey)) {
        clearTimeout(this.timers.get(oldestKey)!);
        this.timers.delete(oldestKey);
      }
    }
  }
}

type RateLimitOptions = {
  interval: number;  // Rate limit window in milliseconds
  limit: number;     // Maximum requests per window
  uniqueTokenPerInterval?: number; // Max unique tokens per interval
};

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval,
  });

  return {
    check: (request: NextRequest) => {
      // Get client IP address from headers or connection info
    let ip: string;
    try {
      const forwardedFor = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      
      if (forwardedFor) {
        ip = forwardedFor.split(',')[0].trim();
      } else if (realIp) {
        ip = realIp.trim();
      } else {
        ip = '127.0.0.1';
      }
    } catch (e) {
      ip = '127.0.0.1';
    }
      const token = ip;
      
      const tokenCount = (tokenCache.get(token) as number[]) || [0];
      
      if (tokenCount[0] >= options.limit) {
        return Promise.reject({ status: 429, message: 'Rate limit exceeded' });
      }
      
      tokenCount[0]++;
      tokenCache.set(token, tokenCount);
      
      return Promise.resolve({
        success: true,
        limit: options.limit,
        remaining: options.limit - tokenCount[0],
        reset: Date.now() + options.interval,
      });
    },
  };
}
