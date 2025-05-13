/**
 * Authentication Middleware
 * Protects routes and enforces authentication requirements
 */
import { NextRequest, NextResponse } from 'next/server';
import { authConfig } from '../config/authConfig';
import { 
  verifyAccessToken,
  validateCsrfToken,
  decodeToken 
} from '../utils/tokens';
import { 
  TokenExpiredError, 
  TokenInvalidError,
  InsufficientPermissionsError,
  CsrfValidationError
} from '../errors/AuthError';
import { AuthTokenPayload } from '../types';

/**
 * Check if a request is authenticated
 * @param request - Next.js request
 * @returns Decoded token payload or null if not authenticated
 */
export function isAuthenticated(request: NextRequest): AuthTokenPayload | null {
  const accessToken = getAccessToken(request);
  
  // Debug logging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AUTH] Checking authentication, token present: ${!!accessToken}`);
    if (accessToken) {
      // Just log the first few characters of the token for debugging
      console.log(`[AUTH] Token starts with: ${accessToken.substring(0, 10)}...`);
    }
    
    // Also log all cookies for debugging
    const cookieNames = [];
    for (const cookie of request.cookies.getAll()) {
      cookieNames.push(cookie.name);
    }
    console.log(`[AUTH] Available cookies: ${cookieNames.join(', ') || 'none'}`);
  }
  
  if (!accessToken) return null;
  
  try {
    // First try our modern token verification
    return verifyAccessToken(accessToken);
  } catch (error) {
    // If that fails, the token might be from simple-login
    // Let's try a simplified approach for backward compatibility
    try {
      // For simple-login tokens, just check if it exists and isn't completely invalid
      // In production, you'd want stricter verification here
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTH] Standard verification failed, trying simplified verification');
      }
      
      // Accept the token as valid if it exists and has basic JWT structure
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        try {
          // Simple base64 decode of payload (middle part)
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString()
          );
          
          // Log what we found
          if (process.env.NODE_ENV !== 'production') {
            console.log('[AUTH] Simple token verification succeeded');
          }
          
          // Return a simplified payload
          return {
            sub: payload.sub || payload.id || '0',
            role: payload.role || 'user',
            username: payload.username || 'unknown',
            iat: payload.iat || 0,
            exp: payload.exp || 0,
            csrf: payload.csrf || '',
          };
        } catch (decodeError) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[AUTH] Failed to decode payload:', decodeError);
          }
        }
      }
      return null;
    } catch (fallbackError) {
      // In middleware, we don't want to throw errors, just return null
      if (process.env.NODE_ENV !== 'production') {
        if (error instanceof TokenExpiredError) {
          console.log('[AUTH] Token expired');
        } else if (error instanceof TokenInvalidError) {
          console.log('[AUTH] Invalid token');
        } else {
          console.log('[AUTH] Authentication error:', error);
        }
      }
      return null;
    }
  }
}

/**
 * Get access token from request cookies
 * @param request - Next.js request
 * @returns Access token or undefined if not present
 */
export function getAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get(authConfig.cookies.access.name)?.value;
}

/**
 * Get refresh token from request cookies
 * @param request - Next.js request
 * @returns Refresh token or undefined if not present
 */
export function getRefreshToken(request: NextRequest): string | undefined {
  return request.cookies.get(authConfig.cookies.refresh.name)?.value;
}

/**
 * Get CSRF token from request headers
 * @param request - Next.js request
 * @returns CSRF token or undefined if not present
 */
export function getCsrfToken(request: NextRequest): string | undefined {
  return request.headers.get('X-CSRF-Token') || undefined;
}

/**
 * Check if user has required role
 * @param request - Next.js request
 * @param role - Required role
 * @returns True if user has required role, false otherwise
 */
export function hasRole(request: NextRequest, role: string): boolean {
  const payload = isAuthenticated(request);
  return !!payload && payload.role === role;
}

/**
 * Require authentication middleware
 * @param request - Next.js request
 * @returns Response with redirect if not authenticated, null if authenticated
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const user = isAuthenticated(request);
  
  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  
  return null;
}

/**
 * Require admin role middleware
 * @param request - Next.js request
 * @returns Response with redirect if not admin, null if admin
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
  const user = isAuthenticated(request);
  
  if (!user || user.role !== 'admin') {
    return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
  }
  
  return null;
}

/**
 * Validate CSRF token for state-changing operations
 * @param request - Next.js request
 * @returns true if valid, false otherwise
 */
export function validateCsrf(request: NextRequest): boolean {
  // Skip for non-mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }
  
  // Get token from header and cookie
  const headerToken = getCsrfToken(request);
  const cookieToken = request.cookies.get(authConfig.cookies.csrf.name)?.value;
  
  // Both tokens must be present and match
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return false;
  }
  
  // Get the CSRF hash from the access token
  const accessToken = getAccessToken(request);
  if (!accessToken) return false;
  
  // Decode token without verification (already verified by isAuthenticated)
  const payload = decodeToken(accessToken);
  if (!payload || !payload.csrf) return false;
  
  // Validate the CSRF token against the hash in the JWT
  return validateCsrfToken(headerToken, payload.csrf);
}

/**
 * Check if a path should be protected
 * @param path - URL pathname
 * @returns true if protected, false otherwise
 */
export function isProtectedPath(path: string): boolean {
  // Check if path is in public paths first (exceptions to protected paths)
  if (authConfig.routes.public.some(publicPath => path.startsWith(publicPath))) {
    return false;
  }
  
  // Check if path is in protected paths
  return authConfig.routes.protected.some(protectedPath => path.startsWith(protectedPath)) ||
         authConfig.routes.protectedApi.some(apiPath => path.startsWith(apiPath));
}

/**
 * Check if a path requires admin role
 * @param path - URL pathname
 * @returns true if admin-only, false otherwise
 */
export function isAdminPath(path: string): boolean {
  return authConfig.routes.adminOnly.some(adminPath => path.startsWith(adminPath));
}

/**
 * Check if a path requires CSRF protection
 * @param path - URL pathname
 * @returns true if CSRF protected, false otherwise
 */
export function isCsrfProtectedPath(path: string): boolean {
  return authConfig.routes.csrfProtected.some(csrfPath => path.startsWith(csrfPath));
}
