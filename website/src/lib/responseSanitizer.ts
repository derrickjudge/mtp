/**
 * Response Sanitization Utility
 * 
 * Prevents sensitive data leakage in API responses by:
 * - Removing sensitive fields like passwords and internal IDs
 * - Sanitizing error messages to avoid information disclosure
 * - Applying consistent response formats
 */

import { NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/middleware/securityHeaders';

// Fields that should always be stripped from responses
const SENSITIVE_FIELDS = [
  'password',
  'hash',
  'salt',
  'secret',
  'token',
  'key',
  'privateKey',
  'private_key',
  '_password',
  'pwd',
  'apiSecret',
  'api_secret',
  'accessSecret',
  'access_secret',
  'credentials',
  'connection_string',
  'connectionString'
];

// Field patterns that should be stripped (regex patterns)
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /hash/i,
  /salt/i,
  /pwd/i,
  /credential/i
];

// Fields that might contain sensitive information in stack traces
const ERROR_FIELDS = [
  'stack',
  'trace',
  'stacktrace',
  'errorStack',
  'error_stack',
];

/**
 * Sanitize an object by removing sensitive data
 * @param data Object to sanitize
 * @param isErrorObject Whether the object is an error object (different handling)
 * @param path Current path in the object (for nested objects)
 * @returns Sanitized object
 */
export function sanitizeResponseData(
  data: any,
  isErrorObject: boolean = false,
  path: string = ''
): any {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitive types
  if (typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponseData(item, isErrorObject, path));
  }

  // Handle objects
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive fields
    if (SENSITIVE_FIELDS.includes(key)) {
      continue;
    }
    
    // Skip fields matching sensitive patterns
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
      continue;
    }
    
    // Handle error objects specially
    if (isErrorObject && ERROR_FIELDS.includes(key)) {
      // Remove complete stack traces
      sanitized[key] = 'Removed for security reasons';
      continue;
    }
    
    // Current path for nested objects
    const currentPath = path ? `${path}.${key}` : key;
    
    // Recursively sanitize nested objects
    sanitized[key] = sanitizeResponseData(
      value, 
      isErrorObject || key === 'error', 
      currentPath
    );
  }
  
  return sanitized;
}

/**
 * Standard types of API responses for consistent formats
 */
export enum ResponseType {
  SUCCESS = 'success',
  ERROR = 'error',
  VALIDATION_ERROR = 'validation_error',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  RATE_LIMITED = 'rate_limited',
  SERVER_ERROR = 'server_error'
}

/**
 * Creates a sanitized and secured API response
 * @param data Response data
 * @param type Response type
 * @param message Response message
 * @param status HTTP status code
 * @returns Sanitized and secured NextResponse
 */
export function createSanitizedResponse(
  data: any = null,
  type: ResponseType = ResponseType.SUCCESS,
  message: string = '',
  status: number = 200
): NextResponse {
  // Default success status
  if (type === ResponseType.SUCCESS && status === 200) {
    status = data ? 200 : 204;
  }
  
  // Status mapping for error types
  if (type === ResponseType.ERROR && status === 200) status = 400;
  if (type === ResponseType.VALIDATION_ERROR) status = 400;
  if (type === ResponseType.UNAUTHORIZED) status = 401;
  if (type === ResponseType.FORBIDDEN) status = 403;
  if (type === ResponseType.NOT_FOUND) status = 404;
  if (type === ResponseType.RATE_LIMITED) status = 429;
  if (type === ResponseType.SERVER_ERROR) status = 500;
  
  // Determine if this is an error response
  const isErrorResponse = type !== ResponseType.SUCCESS;
  
  // Create response body
  const responseBody: Record<string, any> = {
    type,
    success: !isErrorResponse
  };
  
  // Add message if provided
  if (message) {
    responseBody.message = message;
  }
  
  // Add sanitized data if provided
  if (data !== null && data !== undefined) {
    responseBody.data = sanitizeResponseData(data, isErrorResponse);
  }
  
  // Create response with security headers
  const response = NextResponse.json(responseBody, { status });
  return applySecurityHeaders(response);
}

/**
 * Create a success response
 * @param data Response data
 * @param message Success message
 * @param status HTTP status code
 * @returns NextResponse
 */
export function createSuccessResponse(
  data: any = null,
  message: string = 'Operation completed successfully',
  status: number = 200
): NextResponse {
  return createSanitizedResponse(data, ResponseType.SUCCESS, message, status);
}

/**
 * Create an error response
 * @param message Error message
 * @param data Error data
 * @param status HTTP status code
 * @returns NextResponse
 */
export function createErrorResponse(
  message: string = 'An error occurred',
  data: any = null,
  status: number = 400
): NextResponse {
  return createSanitizedResponse(data, ResponseType.ERROR, message, status);
}

/**
 * Create a validation error response
 * @param validationErrors Validation errors
 * @param message Error message
 * @returns NextResponse
 */
export function createValidationErrorResponse(
  validationErrors: any,
  message: string = 'Validation failed'
): NextResponse {
  return createSanitizedResponse(
    { errors: validationErrors },
    ResponseType.VALIDATION_ERROR,
    message,
    400
  );
}

/**
 * Create an unauthorized error response
 * @param message Error message
 * @returns NextResponse
 */
export function createUnauthorizedResponse(
  message: string = 'Authentication required'
): NextResponse {
  return createSanitizedResponse(null, ResponseType.UNAUTHORIZED, message, 401);
}

/**
 * Create a forbidden error response
 * @param message Error message
 * @returns NextResponse
 */
export function createForbiddenResponse(
  message: string = 'Access denied'
): NextResponse {
  return createSanitizedResponse(null, ResponseType.FORBIDDEN, message, 403);
}

/**
 * Create a not found error response
 * @param message Error message
 * @returns NextResponse
 */
export function createNotFoundResponse(
  message: string = 'Resource not found'
): NextResponse {
  return createSanitizedResponse(null, ResponseType.NOT_FOUND, message, 404);
}

/**
 * Create a rate limit error response
 * @param message Error message
 * @param resetTime When rate limit resets
 * @returns NextResponse
 */
export function createRateLimitResponse(
  message: string = 'Rate limit exceeded',
  resetTime?: number
): NextResponse {
  const data = resetTime ? { resetAt: resetTime } : null;
  return createSanitizedResponse(data, ResponseType.RATE_LIMITED, message, 429);
}

/**
 * Create a server error response
 * @param message Error message
 * @param error Original error (will be sanitized)
 * @returns NextResponse
 */
export function createServerErrorResponse(
  message: string = 'Internal server error',
  error?: any
): NextResponse {
  const errorData = error ? { error } : null;
  return createSanitizedResponse(errorData, ResponseType.SERVER_ERROR, message, 500);
}
