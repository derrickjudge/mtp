/**
 * Rate Limiter - Compatibility Layer
 * 
 * This module provides backward compatibility with the old rate limiter interface
 * while using the new enhanced rate limiting functionality.
 * 
 * IMPORTANT: For new code, use enhancedRateLimit.ts directly.
 * This module exists only for backward compatibility with existing code.
 */

import { NextRequest } from 'next/server';
import { createRateLimit } from './enhancedRateLimit';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp when the rate limit resets
}

// Create a default rate limiter using the new enhanced implementation
const defaultRateLimiter = createRateLimit('NORMAL');

/**
 * Rate limiter middleware for API routes
 * 
 * This is a compatibility wrapper around the new enhanced rate limiter.
 * It maintains the same interface as the old implementation but uses the new functionality.
 * 
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
  try {
    // Create a custom rate limiter with the specified parameters
    const customLimiter = createRateLimit({
      maxRequests: limit,
      windowMs: windowMs,
      headers: true
    });
    
    // Check the rate limit using the new implementation
    const result = await customLimiter.check(req);
    
    // Return result in the format expected by the old interface
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset
    };
  } catch (error) {
    // For backward compatibility, log the error but don't throw
    console.error('Rate limiting error:', error);
    
    // Return a default failed response
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Date.now() + windowMs
    };
  }
}

/**
 * Create a rate limiter with custom configuration
 * @param config Rate limit configuration
 * @returns The configured rate limiter function
 */
export function rateLimit(config: {
  interval: number;
  limit: number;
  uniqueTokenPerInterval?: number;
}) {
  // Create a rate limiter with the specified configuration
  const customLimiter = createRateLimit({
    maxRequests: config.limit,
    windowMs: config.interval,
    headers: true,
    uniqueTokenPerInterval: config.uniqueTokenPerInterval
  });
  
  // Return an object with a check method to maintain compatibility
  return {
    check: async (req: NextRequest): Promise<RateLimitResult> => {
      try {
        const result = await customLimiter.check(req);
        return {
          success: result.success,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset
        };
      } catch (error) {
        console.error('Rate limiting error:', error);
        return {
          success: false,
          limit: config.limit,
          remaining: 0,
          reset: Date.now() + config.interval
        };
      }
    }
  };
}
