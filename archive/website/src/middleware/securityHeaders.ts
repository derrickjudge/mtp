/**
 * Security Headers Middleware
 * 
 * Applies consistent security headers to all API responses
 * to protect against common web vulnerabilities.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Applies security headers to the response
 * @param response NextResponse object to add headers to
 * @returns NextResponse with security headers added
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  // Prevents XSS attacks by controlling resources the browser is allowed to load
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' https:; " +
    "media-src 'self'; " +
    "object-src 'none'; " +
    "frame-src 'self';"
  );

  // HTTP Strict Transport Security
  // Forces HTTPS usage and protects against protocol downgrade and cookie hijacking
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // X-Content-Type-Options
  // Prevents MIME type sniffing (browser guessing content type)
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  // Prevents clickjacking by controlling if the browser should render the page in a frame
  response.headers.set('X-Frame-Options', 'DENY');

  // X-XSS-Protection
  // Enables browser's built-in XSS protection (deprecated but still useful for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy
  // Controls how much referrer information the browser includes with requests
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  // Limits which browser features and APIs can be used (replaces Feature-Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Cache-Control for API responses
  // Prevents caching of sensitive API responses
  if (response.headers.get('Cache-Control') === null) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

/**
 * Creates middleware to apply security headers to all API responses
 * @param apiPathPattern Regular expression pattern to match API paths
 * @returns Middleware function
 */
export function createSecurityHeadersMiddleware(apiPathPattern = /^\/api\//) {
  return function middleware(request: NextRequest) {
    // Only apply to API routes
    if (apiPathPattern.test(request.nextUrl.pathname)) {
      // For OPTIONS requests (CORS preflight)
      if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 204 });
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
        return applySecurityHeaders(response);
      }

      // Continue normal request processing
      const response = NextResponse.next();
      return applySecurityHeaders(response);
    }

    // For non-API routes, just continue processing
    return NextResponse.next();
  };
}
