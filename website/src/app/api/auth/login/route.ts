/**
 * Login API Endpoint
 * Authenticates users and returns a JWT token with enhanced security
 * 
 * Security features:
 * - Input validation with standardized schemas
 * - HTTP-only cookies for token storage
 * - CSRF protection
 * - General rate limiting for all requests
 * - Specific tracking of failed login attempts
 * - Account lockout after 3 failed attempts for 5 minutes
 * - Security headers on all responses
 */

import { NextRequest, NextResponse } from 'next/server';
// Using mock auth service for development - no database dependency
import { authenticateUser } from '@/auth/services/mockAuthService';
import { validateData, validationErrorResponse } from '@/lib/validation';
import { authSchemas } from '@/lib/validationSchemas';
import { applySecurityHeaders } from '@/middleware/securityHeaders';
import { createRateLimit } from '@/lib/enhancedRateLimit';
import { setAuthCookies } from '@/auth/utils/cookies';
import { generateCsrfToken } from '@/auth/utils/tokens';
import { InvalidCredentialsError, AccountLockedError, AuthError } from '@/auth/errors/AuthError';

// Create a rate limiter specific to auth endpoints with strict limits
const authRateLimit = createRateLimit('VERY_STRICT');

// Helper function to create consistent error responses with security headers
const createErrorResponse = (message: string, status: number = 400) => {
  const response = NextResponse.json({ success: false, message }, { status });
  return applySecurityHeaders(response);
};

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting first
    const rateLimitResult = await authRateLimit.check(req);
    if (!rateLimitResult.success) {
      return createErrorResponse(
        `Rate limit exceeded. Please try again in ${Math.ceil(rateLimitResult.reset - Date.now()) / 1000} seconds.`, 
        429
      );
    }

    // Parse the request body first
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      return createErrorResponse('Invalid request format', 400);
    }
    
    // Validate parsed request body against schema
    const { username, password } = requestBody;
    const validationResult = validateData(requestBody, authSchemas.login);
    if (!validationResult.valid) {
      return validationErrorResponse(validationResult.errors);
    }

    try {
      // Authenticate user using our new modular auth service
      // This handles account lockout internally now
      const authResult = await authenticateUser({
        username,
        password
      });

      // Login successful - reset rate limiter
      await authRateLimit.resetFailures(req);

      // Create a secure login response with HTTP-only cookies
      const response = NextResponse.json({ 
        success: true, 
        user: {
          id: authResult.user.id,
          username: authResult.user.username,
          role: authResult.user.role
        },
        // Return CSRF token to client for use in future requests
        csrfToken: authResult.csrfToken
      });

      // Set auth cookies and return the response
      return setAuthCookies(response, {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken
      }, authResult.csrfToken);
      
    } catch (error) {
      // Handle specific authentication errors
      if (error instanceof InvalidCredentialsError) {
        await authRateLimit.recordFailure(req);
        return createErrorResponse('Invalid username or password', 401);
      }
      
      if (error instanceof AccountLockedError) {
        return createErrorResponse(
          error.message,
          error.status
        );
      }
      
      if (error instanceof AuthError) {
        return createErrorResponse(error.message, error.status);
      }
      
      // Unexpected error
      console.error('Login error:', error);
      return createErrorResponse('Server error during login. Please try again later.', 500);
    }

  } catch (error) {
    console.error('Login route error:', error);
    return createErrorResponse('Server error during login. Please try again later.', 500);
  }
}
