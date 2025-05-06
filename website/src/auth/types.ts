/**
 * Authentication System Types
 * Defines all types and interfaces used across the authentication system
 */

/**
 * User authentication payload - stored in JWT token
 */
export interface AuthTokenPayload {
  sub: string | number; // User ID
  username: string;
  role: string;
  csrf?: string; // CSRF token hash (for session tokens)
  jti?: string; // Unique token identifier (for token invalidation)
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
  tokenType?: 'access' | 'refresh'; // Token type
}

/**
 * Authentication result returned after successful login
 */
export interface AuthResult {
  user: UserData;
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

/**
 * User data safe to return to the client (no password)
 */
export interface UserData {
  id: string | number;
  username: string;
  role: string;
  email?: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Token pair
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Authentication cookie options
 */
export interface AuthCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge: number;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  statusCode: number;
}

/**
 * Authentication error codes
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'auth/invalid-credentials',
  TOKEN_EXPIRED = 'auth/token-expired',
  TOKEN_INVALID = 'auth/token-invalid',
  INSUFFICIENT_PERMISSIONS = 'auth/insufficient-permissions',
  RATE_LIMITED = 'auth/rate-limited',
  ACCOUNT_LOCKED = 'auth/account-locked',
  SERVER_ERROR = 'auth/server-error',
  CSRF_VALIDATION_FAILED = 'auth/csrf-validation-failed',
}
