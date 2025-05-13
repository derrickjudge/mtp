/**
 * Next.js Middleware
 * Protects routes and API endpoints with enhanced security:
 * - Authentication verification
 * - Role-based access control
 * - Security headers
 * - Rate limiting protection
 * - CSRF protection
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  isAuthenticated,
  isProtectedPath,
  isAdminPath,
  validateCsrf,
  isCsrfProtectedPath
} from './auth/middleware/authMiddleware';
import { authConfig } from './auth/config/authConfig';
import { UserData } from './auth/types';

// Enhanced security modules
import { applySecurityHeaders } from './middleware/securityHeaders'
import { createRateLimit } from './lib/enhancedRateLimit'

// Create rate limiters for different types of endpoints
const apiRateLimit = createRateLimit('NORMAL')
const authRateLimit = createRateLimit('STRICT')
const adminRateLimit = createRateLimit('STRICT')

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  
  // Apply security headers to all responses
  applySecurityHeaders(response);
  
  // Log debugging information in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[MIDDLEWARE] Processing request for: ${pathname}`);
    const cookieNames = request.cookies.getAll().map(c => c.name).join(', ');
    console.log(`[MIDDLEWARE] Cookies present:`, cookieNames || 'none');
  }
  
  // Apply rate limiting to API endpoints
  if (pathname.startsWith('/api/')) {
    // Different rate limits for different API types
    let rateLimitResult;
    
    if (pathname.startsWith('/api/auth/')) {
      // Stricter rate limits for auth endpoints
      rateLimitResult = await authRateLimit.check(request);
    } else if (pathname.startsWith('/admin/')) {
      // Admin API rate limits
      rateLimitResult = await adminRateLimit.check(request);
    } else {
      // Normal API rate limits
      rateLimitResult = await apiRateLimit.check(request);
    }
    
    // If rate limited, return 429 response
    if (!rateLimitResult.success) {
      return await apiRateLimit.createLimitedResponse(request, rateLimitResult);
    }
  }
  
  // Skip authentication for public paths
  if (authConfig.routes.public.some(publicPath => pathname.startsWith(publicPath))) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MIDDLEWARE] Public path, skipping authentication`);
    }
    return NextResponse.next();
  }
  
  // Check if path requires authentication
  if (isProtectedPath(pathname)) {
    // Check if the user is authenticated
    const user = isAuthenticated(request);
    
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[MIDDLEWARE] Authentication failed, redirecting`);
      }
      
      // Record failed auth attempt for rate limiting if API
      if (pathname.startsWith('/api/')) {
        await authRateLimit.recordFailure(request);
        
        // For API routes, return 401 Unauthorized with proper headers
        const errorResponse = NextResponse.json(
          { success: false, message: 'Unauthorized' }, 
          { status: 401 }
        );
        return applySecurityHeaders(errorResponse);
      }
      
      // For UI routes, redirect to login
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Redirecting unauthenticated user to login from ${pathname}`);
      }
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check for admin permissions if required
    if (isAdminPath(pathname) && user.role !== 'admin') {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[MIDDLEWARE] User lacks admin privileges`);
      }
      
      // For API routes, return 403 Forbidden
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
      
      // For UI routes, redirect to unauthorized page
      const unauthorizedUrl = new URL('/admin/unauthorized', request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }
    
    // Check CSRF for state-changing operations
    if (isCsrfProtectedPath(pathname) && 
        !['GET', 'HEAD', 'OPTIONS'].includes(request.method) && 
        !validateCsrf(request)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[MIDDLEWARE] CSRF validation failed`);
      }
      
      return NextResponse.json(
        { success: false, message: 'CSRF validation failed' },
        { status: 403 }
      );
    }
    
    // Add user information to request headers for downstream handlers
    const requestHeaders = new Headers(request.headers);
    // Since AuthTokenPayload has sub property, not id
    requestHeaders.set('x-user-id', (user.sub ?? '0').toString());
    requestHeaders.set('x-user-role', user.role || 'guest');
    
    // Clone the request with the new headers
    const newRequest = new NextRequest(request.url, {
      headers: requestHeaders,
      method: request.method,
      body: request.body,
      cache: request.cache,
      credentials: request.credentials,
      integrity: request.integrity,
      keepalive: request.keepalive,
      mode: request.mode,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      signal: request.signal,
    });
    
    // Continue with the modified request
    return NextResponse.next({
      request: newRequest,
    });
  }
  
  return NextResponse.next()
}

// Configure the paths this middleware will run on
export const config = {
  matcher: [
    '/admin/:path*', 
    '/api/:path*',
  ],
}
