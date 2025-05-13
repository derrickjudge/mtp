/**
 * Token Refresh API Endpoint
 * 
 * Handles refreshing expired access tokens using refresh tokens
 * 
 * Security features:
 * - HTTP-only cookies for token storage
 * - CSRF protection
 * - Rate limiting to prevent abuse
 * - Token rotation for enhanced security
 */

import { NextRequest, NextResponse } from 'next/server';
// Using mock auth service for development - no database dependency
import { refreshTokens } from '@/auth/services/mockAuthService';
import { verifyRefreshToken } from '@/auth/utils/tokens';
import { setAuthCookies } from '@/auth/utils/cookies';
import { applySecurityHeaders } from '@/middleware/securityHeaders';
import { createRateLimit } from '@/lib/enhancedRateLimit';
import { TokenExpiredError, TokenInvalidError, AuthError } from '@/auth/errors/AuthError';
import { authConfig } from '@/auth/config/authConfig';

// Create a rate limiter specific to refresh token endpoints
const refreshRateLimit = createRateLimit('STRICT');

// Helper function to create consistent error responses with security headers
const createErrorResponse = (message: string, status: number = 400) => {
  const response = NextResponse.json({ success: false, message }, { status });
  return applySecurityHeaders(response);
};

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting first
    const rateLimitResult = await refreshRateLimit.check(req);
    if (!rateLimitResult.success) {
      return createErrorResponse(
        `Rate limit exceeded. Please try again in ${Math.ceil(rateLimitResult.reset - Date.now()) / 1000} seconds.`, 
        429
      );
    }

    // Get refresh token from cookies
    const refreshToken = req.cookies.get(authConfig.cookies.refresh.name)?.value;
    
    if (!refreshToken) {
      await refreshRateLimit.recordFailure(req);
      return createErrorResponse('No refresh token provided', 401);
    }

    try {
      // Verify the refresh token first
      verifyRefreshToken(refreshToken);
      
      // Generate new token pair
      const { tokens, csrfToken } = await refreshTokens(refreshToken);
      
      // Create a successful response with new token details
      const response = NextResponse.json({ 
        success: true,
        csrfToken // Return new CSRF token to the client
      });

      // Set the new tokens as cookies
      return setAuthCookies(response, tokens, csrfToken);
      
    } catch (error) {
      await refreshRateLimit.recordFailure(req);
      
      // Handle specific token errors
      if (error instanceof TokenExpiredError) {
        return createErrorResponse('Refresh token expired, please log in again', 401);
      }
      
      if (error instanceof TokenInvalidError) {
        return createErrorResponse('Invalid refresh token', 401);
      }
      
      if (error instanceof AuthError) {
        return createErrorResponse(error.message, error.status);
      }
      
      // Unexpected error
      console.error('Token refresh error:', error);
      return createErrorResponse('Error refreshing token', 500);
    }
  } catch (error) {
    console.error('Refresh route error:', error);
    return createErrorResponse('Server error during token refresh', 500);
  }
}
