/**
 * Logout API Endpoint
 * Securely logs out users by clearing HTTP-only auth cookies
 * with enhanced security features including rate limiting and security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/auth/utils/cookies';
import { applySecurityHeaders } from '@/middleware/securityHeaders';
import { createRateLimit } from '@/lib/enhancedRateLimit';

// Create rate limiter for auth endpoints
const authRateLimit = createRateLimit('NORMAL');

/**
 * Helper function to create error responses with consistent format and security headers
 */
function createErrorResponse(message: string, status: number = 400) {
  const response = NextResponse.json(
    { success: false, message },
    { status }
  );
  return applySecurityHeaders(response);
}

/**
 * POST handler for logout requests
 * Clears all authentication cookies and invalidates the session
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting (with normal limits since this is not a sensitive operation)
    const rateLimitResult = await authRateLimit.check(req);
    if (!rateLimitResult.success) {
      return createErrorResponse(
        'Too many logout attempts. Please try again later.',
        429
      );
    }

    // Create response and clear all auth cookies
    const response = NextResponse.json({ success: true, message: 'Successfully logged out' });
    return clearAuthCookies(applySecurityHeaders(response));
  } catch (error) {
    console.error('Logout error:', error);
    return createErrorResponse('Error during logout. Please try again.', 500);
  }
}
