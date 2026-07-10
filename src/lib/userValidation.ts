// Shared validation for admin user-management endpoints (create/update).

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;
const VALID_ROLES = ['USER', 'EDITOR', 'ADMIN'] as const;
export type UserRole = (typeof VALID_ROLES)[number];

export type UserValidationResult =
  | { valid: true }
  | { valid: false; status: number; message: string };

/**
 * Validate a user-supplied email address.
 *
 * @param email The raw value from the request body.
 * @returns A discriminated result; when invalid, carries the HTTP status and
 *   client-safe message to return.
 */
export function validateEmail(email: unknown): UserValidationResult {
  if (typeof email !== 'string' || !email.trim()) {
    return { valid: false, status: 400, message: 'Email is required' };
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return { valid: false, status: 400, message: 'Email must be a valid address' };
  }
  return { valid: true };
}

/**
 * Validate a user-supplied password against the minimum length policy.
 *
 * @param password The raw value from the request body.
 * @returns A discriminated result; when invalid, carries the HTTP status and
 *   client-safe message to return.
 */
export function validatePassword(password: unknown): UserValidationResult {
  if (typeof password !== 'string' || !password) {
    return { valid: false, status: 400, message: 'Password is required' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      status: 400,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }
  return { valid: true };
}

/**
 * Validate an optional role against the known Role enum values.
 *
 * @param role The raw value from the request body; undefined is accepted so
 *   callers can apply their own default.
 * @returns A discriminated result; when invalid, carries the HTTP status and
 *   client-safe message to return.
 */
export function validateRole(role: unknown): UserValidationResult {
  if (role === undefined) {
    return { valid: true };
  }
  if (typeof role !== 'string' || !VALID_ROLES.includes(role as UserRole)) {
    return {
      valid: false,
      status: 400,
      message: `Role must be one of ${VALID_ROLES.join(', ')}`,
    };
  }
  return { valid: true };
}
