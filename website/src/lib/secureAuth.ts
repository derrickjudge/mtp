/**
 * Secure Authentication System
 * 
 * Implements secure authentication with:
 * - HTTP-only cookies for token storage instead of localStorage
 * - Token rotation mechanisms
 * - CSRF protection
 * - Access and refresh token separation
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import jwt, { SignOptions } from 'jsonwebtoken';
import { createHash } from 'crypto';

// Environment variables (should be properly validated in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m' as string; // 15 minutes
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d' as string; // 7 days
const CSRF_SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-key-change-in-production';

// User data type
export interface UserData {
  id: number | string;
  username: string;
  email?: string;
  role: string;
  [key: string]: any; // Additional user properties
}

// Token pair type
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

// JWT payload type
interface JwtPayload {
  sub: string | number; // Subject (user ID)
  username: string;
  role: string;
  jti: string; // JWT ID (unique identifier for this token)
  iat: number; // Issued at
  exp: number; // Expiration time
  [key: string]: any; // Additional claims
}

/**
 * Generate a secure CSRF token
 * @returns A secure random token
 */
export function generateCsrfToken(): string {
  return uuidv4();
}

/**
 * Hash a CSRF token for secure storage/comparison
 * @param token Raw CSRF token
 * @returns Hashed token
 */
export function hashCsrfToken(token: string): string {
  return createHash('sha256')
    .update(`${token}${CSRF_SECRET}`)
    .digest('hex');
}

/**
 * Generate JWT tokens (access and refresh) for a user
 * @param user User data to encode in the token
 * @returns Object containing access token, refresh token, and CSRF token
 */
export function generateTokens(user: UserData): TokenPair {
  // Generate a unique token ID
  const tokenId = uuidv4();
  
  // Generate CSRF token
  const csrfToken = generateCsrfToken();
  const hashedCsrf = hashCsrfToken(csrfToken);
  
  // Create the payload for the access token
  const accessPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: user.id,
    username: user.username,
    role: user.role,
    jti: tokenId,
    csrf: hashedCsrf
  };
  
  // Create the payload for the refresh token
  const refreshPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: user.id,
    username: user.username,
    role: user.role,
    jti: tokenId,
    tokenType: 'refresh'
  };
  
  // Sign the tokens
  const accessToken = jwt.sign(
    accessPayload,
    JWT_SECRET,
    // Type assertion to resolve TypeScript error with expiresIn
    { expiresIn: ACCESS_TOKEN_EXPIRY } as jwt.SignOptions
  );
  
  const refreshToken = jwt.sign(
    refreshPayload,
    JWT_REFRESH_SECRET,
    // Type assertion to resolve TypeScript error with expiresIn
    { expiresIn: REFRESH_TOKEN_EXPIRY } as jwt.SignOptions
  );
  
  return {
    accessToken,
    refreshToken,
    csrfToken
  };
}

/**
 * Verify a JWT access token
 * @param token JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  console.log(`[TOKEN] Verifying access token, length: ${token.length}`);
  console.log(`[TOKEN] JWT_SECRET length: ${JWT_SECRET.length}`);
  
  try {
    // Log token parts without revealing full token
    const parts = token.split('.');
    if (parts.length === 3) {
      console.log(`[TOKEN] Token structure is valid (has 3 parts)`);
    } else {
      console.log(`[TOKEN] Invalid token structure, has ${parts.length} parts instead of 3`);
    }
    
    // Try to decode without verification to see payload structure
    try {
      const decodedWithoutVerify = jwt.decode(token);
      // Use type assertion for TypeScript safety while logging
      const decodedAny = decodedWithoutVerify as any;
      console.log(`[TOKEN] Decoded without verification:`, 
        decodedWithoutVerify ? 
        `Contains sub: ${!!decodedAny?.sub}, username: ${!!decodedAny?.username}, role: ${!!decodedAny?.role}` : 
        'Failed to decode');
    } catch (decodeErr) {
      console.log(`[TOKEN] Error decoding token:`, decodeErr);
    }
    
    // Actually verify the token
    console.log(`[TOKEN] Attempting verification with secret...`);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log(`[TOKEN] Verification successful! User:`, decoded.username);
    return decoded;
  } catch (error) {
    console.log(`[TOKEN] Verification failed with error:`, error);
    return null;
  }
}

/**
 * Verify a JWT refresh token
 * @param token Refresh token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
    
    // Ensure it's a refresh token
    if (decoded.tokenType !== 'refresh') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Set secure authentication cookies on a response
 * @param response NextResponse object to set cookies on
 * @param tokens Token pair to set as cookies
 * @param secure Whether to use secure cookies (true in production)
 * @returns Updated response with cookies set
 */
export function setAuthCookies(
  response: NextResponse,
  tokens: TokenPair,
  secure: boolean = process.env.NODE_ENV === 'production'
): NextResponse {
  console.log('[COOKIES] Setting auth cookies, secure:', secure);
  
  // Set the access token as an HTTP-only cookie
  response.cookies.set({
    name: 'access_token',
    value: tokens.accessToken,
    httpOnly: true,
    secure: secure,
    sameSite: 'lax', // Allow cookies to be sent with navigation requests
    path: '/',
    maxAge: 60 * 15, // 15 minutes in seconds
  });
  console.log('[COOKIES] Set access_token cookie');
  
  // Set the refresh token as an HTTP-only cookie with longer expiration
  response.cookies.set({
    name: 'refresh_token',
    value: tokens.refreshToken,
    httpOnly: true,
    secure: secure,
    sameSite: 'lax', // Allow cookies to be sent with navigation requests
    path: '/', // Make available to all paths
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });
  console.log('[COOKIES] Set refresh_token cookie');
  
  // Set CSRF token as a non-HTTP-only cookie (accessible to JavaScript)
  response.cookies.set({
    name: 'csrf_token',
    value: tokens.csrfToken,
    httpOnly: false, // Accessible to client JavaScript
    secure: secure,
    sameSite: 'lax', // Allow cookies to be sent with navigation requests
    path: '/',
    maxAge: 60 * 15, // 15 minutes in seconds
  });
  console.log('[COOKIES] Set csrf_token cookie');
  
  return response;
}

/**
 * Clear auth cookies from a response
 * @param response NextResponse to clear cookies from
 * @returns Updated response with cookies cleared
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
  response.cookies.delete('csrf_token');
  return response;
}

/**
 * Extract user information from a request
 * @param req NextRequest object
 * @returns User data from the token or null if not authenticated
 */
export function getUserFromRequest(req: NextRequest): UserData | null {
  // Get the access token from the cookie
  const accessToken = req.cookies.get('access_token')?.value;
  
  if (!accessToken) {
    console.log('[AUTH] No access_token cookie found in request');
    return null;
  }
  
  console.log('[AUTH] Found access_token cookie, length:', accessToken.length);
  
  // Verify the token
  const payload = verifyAccessToken(accessToken);
  
  if (!payload) {
    console.log('[AUTH] Token verification failed');
    return null;
  }
  
  console.log('[AUTH] Token verified successfully, user:', payload.username);
  
  // Extract user data from payload
  return {
    id: payload.sub,
    username: payload.username,
    role: payload.role
  };
}

/**
 * Validate CSRF token from request against the token in the JWT
 * @param req NextRequest object containing CSRF token header/cookie and JWT with hashed CSRF
 * @returns True if valid, false otherwise
 */
export function validateCsrfToken(req: NextRequest): boolean {
  // Get the CSRF token from the header or cookie
  const csrfToken = req.headers.get('X-CSRF-Token') || req.cookies.get('csrf_token')?.value;
  
  // Get the access token
  const accessToken = req.cookies.get('access_token')?.value;
  
  if (!csrfToken || !accessToken) {
    return false;
  }
  
  // Verify the access token
  const payload = verifyAccessToken(accessToken);
  
  if (!payload || !payload.csrf) {
    return false;
  }
  
  // Hash the provided CSRF token
  const hashedCsrf = hashCsrfToken(csrfToken);
  
  // Compare with the hash in the JWT
  return hashedCsrf === payload.csrf;
}

/**
 * Create a secure login response with HTTP-only cookies
 * @param user User data to encode in tokens
 * @param includeUser Whether to include user data in the response body
 * @returns NextResponse with auth cookies set
 */
export function createLoginResponse(
  user: UserData,
  includeUser: boolean = true
): NextResponse {
  console.log('[LOGIN] Creating login response for user:', user.username);
  
  // Generate tokens
  const tokens = generateTokens(user);
  console.log('[LOGIN] Generated tokens - accessToken length:', tokens.accessToken.length);
  
  // Create response with or without user data
  let responseData: any = includeUser 
    ? { success: true, user: { id: user.id, username: user.username, role: user.role } }
    : { success: true };
  
  // Also include authentication debug info in development
  if (process.env.NODE_ENV !== 'production') {
    responseData.debug = {
      message: 'This debug info is only included in development',
      authTokenSet: true,
      tokenType: 'JWT in HTTP-only cookies',
      userInfo: { id: user.id, username: user.username, role: user.role },
    };
  }
  
  // Create response
  const response = NextResponse.json(responseData, { status: 200 });
  
  // Set cookies
  console.log('[LOGIN] Setting auth cookies on response');
  
  // Set auth cookies and return response
  return setAuthCookies(response, tokens);
}

/**
 * Create a secure logout response that clears auth cookies
 * @returns NextResponse with auth cookies cleared
 */
export function createLogoutResponse(): NextResponse {
  const response = NextResponse.json({ success: true }, { status: 200 });
  return clearAuthCookies(response);
}

/**
 * Handle token refresh request
 * @param req NextRequest with refresh token
 * @returns NextResponse with new tokens or error
 */
export async function handleTokenRefresh(req: NextRequest): Promise<NextResponse> {
  // Get the refresh token
  const refreshToken = req.cookies.get('refresh_token')?.value;
  
  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: 'No refresh token provided' },
      { status: 401 }
    );
  }
  
  // Verify the refresh token
  const payload = verifyRefreshToken(refreshToken);
  
  if (!payload) {
    const response = NextResponse.json(
      { success: false, message: 'Invalid refresh token' },
      { status: 401 }
    );
    
    // Clear cookies since the refresh token is invalid
    return clearAuthCookies(response);
  }
  
  // Create user object from payload
  const user: UserData = {
    id: payload.sub,
    username: payload.username,
    role: payload.role
  };
  
  // Generate new tokens
  const tokens = generateTokens(user);
  
  // Create response
  const response = NextResponse.json(
    { success: true, message: 'Token refreshed successfully' },
    { status: 200 }
  );
  
  // Set cookies
  return setAuthCookies(response, tokens);
}

/**
 * Middleware to require authentication
 * @param req NextRequest object
 * @returns NextResponse or null if authenticated
 */
export function requireAuth(req: NextRequest): NextResponse | null {
  const user = getUserFromRequest(req);
  
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Validate CSRF token for non-GET requests
  if (req.method !== 'GET' && !validateCsrfToken(req)) {
    return NextResponse.json(
      { success: false, message: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
  return null;
}

/**
 * Middleware to require specific role
 * @param req NextRequest object
 * @param requiredRole Role required for access
 * @returns NextResponse or null if authorized
 */
export function requireRole(req: NextRequest, requiredRole: string): NextResponse | null {
  // First check if authenticated
  const authCheck = requireAuth(req);
  if (authCheck) {
    return authCheck;
  }
  
  // Get user from request
  const user = getUserFromRequest(req);
  
  // This should never happen since requireAuth passed
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Check if user has required role
  if (user.role !== requiredRole) {
    return NextResponse.json(
      { success: false, message: 'Insufficient permissions' },
      { status: 403 }
    );
  }
  
  return null;
}

/**
 * Create auth response headers for client-side rendering
 * @param userData User data to include in auth headers
 * @returns Auth headers object
 */
export function createAuthHeaders(userData: UserData | null): { [key: string]: string } {
  if (!userData) {
    return {};
  }
  
  return {
    'X-User-Id': userData.id.toString(),
    'X-User-Role': userData.role,
  };
}
