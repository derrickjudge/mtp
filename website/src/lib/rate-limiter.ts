import { NextRequest } from 'next/server';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp when the rate limit resets
}

// Simple in-memory store for rate limiting
// In production, this should be replaced with Redis or similar
const rateLimit = new Map<string, { count: number, reset: number }>();

/**
 * Rate limiter middleware for API routes
 * @param req The incoming request
 * @param limit Maximum number of requests allowed in the time window
 * @param windowMs Time window in milliseconds (default: 60000ms = 1 minute)
 * @returns Object with rate limit information
 */
export async function rateLimiter(
  req: NextRequest,
  limit: number = 60,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  // For production, use a real IP address
  // In development, use a placeholder
  const ip = process.env.NODE_ENV === 'production'
    ? req.ip || 'unknown'
    : 'development';
    
  // Create a unique key based on the IP and the request path
  const key = `${ip}-${req.nextUrl.pathname}`;
  const now = Date.now();
  
  // Get existing rate limit data or create new entry
  const rateData = rateLimit.get(key) || { count: 0, reset: now + windowMs };
  
  // If the reset time has passed, reset the counter
  if (now > rateData.reset) {
    rateData.count = 0;
    rateData.reset = now + windowMs;
  }
  
  // Increment the counter
  rateData.count++;
  
  // Store updated rate limit data
  rateLimit.set(key, rateData);
  
  // Clean up old entries every few minutes to prevent memory leaks
  occasionalCleanup();
  
  // Check if limit has been exceeded
  const success = rateData.count <= limit;
  
  return {
    success,
    limit,
    remaining: Math.max(0, limit - rateData.count),
    reset: rateData.reset
  };
}

// Variable to track last cleanup time
let lastCleanup = Date.now();

/**
 * Occasionally clean up old rate limit entries to prevent memory leaks
 */
function occasionalCleanup() {
  const now = Date.now();
  // Only clean up every 5 minutes
  if (now - lastCleanup > 5 * 60 * 1000) {
    const cleanupThreshold = now - 10 * 60 * 1000; // 10 minutes
    
    for (const [key, data] of rateLimit.entries()) {
      if (data.reset < cleanupThreshold) {
        rateLimit.delete(key);
      }
    }
    
    lastCleanup = now;
  }
}
