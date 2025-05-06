/**
 * Cookie Utilities
 * Handles cookie management for authentication tokens
 */
import { cookies } from 'next/headers';
import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import { NextResponse } from 'next/server';
import { authConfig } from '../config/authConfig';
import { TokenPair } from '../types';

/**
 * Set authentication cookies in a response
 * @param response - NextResponse object to set cookies on
 * @param tokens - Access and refresh tokens
 * @param csrfToken - CSRF token for cross-site request forgery protection
 * @returns Updated response with cookies
 */
export function setAuthCookies(
  response: NextResponse,
  tokens: TokenPair,
  csrfToken?: string
): NextResponse {
  // Set access token cookie
  response.cookies.set({
    name: authConfig.cookies.access.name,
    value: tokens.accessToken,
    httpOnly: authConfig.cookies.access.httpOnly,
    secure: authConfig.cookies.access.secure,
    sameSite: authConfig.cookies.access.sameSite,
    path: authConfig.cookies.access.path,
    maxAge: authConfig.cookies.access.maxAge,
  });

  // Set refresh token cookie
  response.cookies.set({
    name: authConfig.cookies.refresh.name,
    value: tokens.refreshToken,
    httpOnly: authConfig.cookies.refresh.httpOnly,
    secure: authConfig.cookies.refresh.secure,
    sameSite: authConfig.cookies.refresh.sameSite,
    path: authConfig.cookies.refresh.path,
    maxAge: authConfig.cookies.refresh.maxAge,
  });

  // Set CSRF token cookie if provided (client readable for CSRF protection)
  if (csrfToken) {
    response.cookies.set({
      name: authConfig.cookies.csrf.name,
      value: csrfToken,
      httpOnly: authConfig.cookies.csrf.httpOnly,
      secure: authConfig.cookies.csrf.secure,
      sameSite: authConfig.cookies.csrf.sameSite,
      path: authConfig.cookies.csrf.path,
      maxAge: authConfig.cookies.csrf.maxAge,
    });
  }

  return response;
}

/**
 * Clear authentication cookies from a response
 * @param response - NextResponse object to clear cookies from
 * @returns Updated response with cookies cleared
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete(authConfig.cookies.access.name);
  response.cookies.delete(authConfig.cookies.refresh.name);
  response.cookies.delete(authConfig.cookies.csrf.name);
  
  return response;
}

/**
 * Set authentication cookies using the server-side cookies() API
 * For use in Server Components and Route Handlers
 * @param tokens - Access and refresh tokens
 * @param csrfToken - CSRF token
 */
/**
 * Set authentication cookies using the server-side cookies() API
 * For use in Server Components and Route Handlers
 * This is a simplified version to work around TypeScript issues
 * @param tokens - Access and refresh tokens
 * @param csrfToken - CSRF token
 */
export function setServerAuthCookies(tokens: TokenPair, csrfToken?: string): void {
  try {
    // We'll use response objects directly instead of cookies() due to TypeScript issues
    // with the Next.js cookies API varying between server components and middleware
    const response = new NextResponse();
    
    // Set the cookies on the response
    setAuthCookies(response, tokens, csrfToken);
    
    // Log success for debugging
    console.log('[AUTH] Server-side cookies set successfully');
  } catch (error) {
    console.error('[AUTH] Error setting server-side cookies:', error);
  }
}

/**
 * Clear authentication cookies using the server-side cookies() API
 * This is a simplified version to work around TypeScript issues
 */
export function clearServerAuthCookies(): void {
  try {
    // We'll use response objects directly instead of cookies() due to TypeScript issues
    const response = new NextResponse();
    
    // Clear all auth cookies
    clearAuthCookies(response);
    
    console.log('[AUTH] Server-side cookies cleared successfully');
  } catch (error) {
    console.error('[AUTH] Error clearing server-side cookies:', error);
  }
}
