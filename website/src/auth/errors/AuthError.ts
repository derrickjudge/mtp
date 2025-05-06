/**
 * Authentication Error Classes
 * Provides structured error types for authentication-related issues
 */
import { AuthErrorCode } from '../types';

/**
 * Base authentication error class
 */
export class AuthError extends Error {
  constructor(
    message: string, 
    public code: AuthErrorCode, 
    public status: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends AuthError {
  constructor(message: string = 'Invalid username or password') {
    super(message, AuthErrorCode.INVALID_CREDENTIALS, 401);
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Token expired error
 */
export class TokenExpiredError extends AuthError {
  constructor(message: string = 'Authentication token has expired') {
    super(message, AuthErrorCode.TOKEN_EXPIRED, 401);
    this.name = 'TokenExpiredError';
  }
}

/**
 * Invalid token error
 */
export class TokenInvalidError extends AuthError {
  constructor(message: string = 'Invalid authentication token') {
    super(message, AuthErrorCode.TOKEN_INVALID, 401);
    this.name = 'TokenInvalidError';
  }
}

/**
 * Insufficient permissions error
 */
export class InsufficientPermissionsError extends AuthError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(message, AuthErrorCode.INSUFFICIENT_PERMISSIONS, 403);
    this.name = 'InsufficientPermissionsError';
  }
}

/**
 * Rate limiting error
 */
export class RateLimitError extends AuthError {
  constructor(message: string = 'Too many requests, please try again later', public retryAfter?: number) {
    super(message, AuthErrorCode.RATE_LIMITED, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Account locked error
 */
export class AccountLockedError extends AuthError {
  constructor(message: string = 'Account locked due to too many failed attempts', public lockDuration?: number) {
    super(message, AuthErrorCode.ACCOUNT_LOCKED, 429);
    this.name = 'AccountLockedError';
  }
}

/**
 * CSRF validation error
 */
export class CsrfValidationError extends AuthError {
  constructor(message: string = 'CSRF validation failed') {
    super(message, AuthErrorCode.CSRF_VALIDATION_FAILED, 403);
    this.name = 'CsrfValidationError';
  }
}
