/**
 * Token Utilities
 * Handles JWT token generation, verification, and management
 */
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthTokenPayload, TokenPair, UserData } from '../types';
import { authConfig } from '../config/authConfig';
import { TokenExpiredError, TokenInvalidError } from '../errors/AuthError';

/**
 * Generate an access token for a user
 * @param user - User data to encode in token
 * @param csrfToken - CSRF token to include in the payload
 * @returns JWT access token
 */
export function generateAccessToken(user: UserData, csrfToken?: string): string {
  // Create the token payload
  const payload: AuthTokenPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    tokenType: 'access',
    jti: crypto.randomUUID(), // Unique token ID
  };
  
  // If CSRF token provided, add hash to payload
  if (csrfToken) {
    payload.csrf = hashCsrfToken(csrfToken);
  }
  
  // Sign and return the token
  return jwt.sign(payload, authConfig.jwt.accessSecret, {
    expiresIn: authConfig.jwt.accessExpiresIn,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience,
  });
}

/**
 * Generate a refresh token for a user
 * @param user - User data to encode in token
 * @returns JWT refresh token
 */
export function generateRefreshToken(user: UserData): string {
  const payload: AuthTokenPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    tokenType: 'refresh',
    jti: crypto.randomUUID(), // Unique token ID
  };
  
  return jwt.sign(payload, authConfig.jwt.refreshSecret, {
    expiresIn: authConfig.jwt.refreshExpiresIn,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience,
  });
}

/**
 * Generate both access and refresh tokens for a user
 * @param user - User data
 * @param csrfToken - Optional CSRF token
 * @returns Object containing both tokens
 */
export function generateTokenPair(user: UserData, csrfToken?: string): TokenPair {
  return {
    accessToken: generateAccessToken(user, csrfToken),
    refreshToken: generateRefreshToken(user),
  };
}

/**
 * Verify an access token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws {TokenExpiredError} If token has expired
 * @throws {TokenInvalidError} If token is invalid
 */
export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    return jwt.verify(token, authConfig.jwt.accessSecret, {
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    }) as AuthTokenPayload;
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError();
    }
    throw new TokenInvalidError();
  }
}

/**
 * Verify a refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded token payload
 * @throws {TokenExpiredError} If token has expired
 * @throws {TokenInvalidError} If token is invalid
 */
export function verifyRefreshToken(token: string): AuthTokenPayload {
  try {
    const payload = jwt.verify(token, authConfig.jwt.refreshSecret, {
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    }) as AuthTokenPayload;
    
    // Ensure it's a refresh token
    if (payload.tokenType !== 'refresh') {
      throw new TokenInvalidError('Invalid token type');
    }
    
    return payload;
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError();
    }
    throw new TokenInvalidError();
  }
}

/**
 * Decode a token without verification (unsafe, use only for debugging)
 * @param token - JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.decode(token) as AuthTokenPayload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Generate a new CSRF token
 * @returns Random CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(authConfig.csrf.tokenLength / 2).toString('hex');
}

/**
 * Hash a CSRF token for storage in JWT
 * @param csrfToken - CSRF token to hash
 * @returns Hashed CSRF token
 */
export function hashCsrfToken(csrfToken: string): string {
  return crypto
    .createHmac('sha256', authConfig.csrf.secret)
    .update(csrfToken)
    .digest('hex');
}

/**
 * Validate a CSRF token against a hash
 * @param csrfToken - CSRF token from client
 * @param csrfHash - CSRF hash from JWT payload
 * @returns True if valid, false otherwise
 */
export function validateCsrfToken(csrfToken: string, csrfHash: string): boolean {
  const hash = hashCsrfToken(csrfToken);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(csrfHash));
}
