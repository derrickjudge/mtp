/**
 * User Validation Tests
 *
 * @jest-environment node
 */

import { validateEmail, validatePassword, validateRole } from '@/lib/userValidation';

describe('validateEmail', () => {
  it('rejects a missing email', () => {
    expect(validateEmail(undefined)).toEqual({
      valid: false,
      status: 400,
      message: 'Email is required',
    });
  });

  it('rejects an empty/whitespace email', () => {
    expect(validateEmail('   ')).toEqual({
      valid: false,
      status: 400,
      message: 'Email is required',
    });
  });

  it('rejects a malformed email', () => {
    const result = validateEmail('not-an-email');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.status).toBe(400);
      expect(result.message).toMatch(/valid/i);
    }
  });

  it('accepts a well-formed email', () => {
    expect(validateEmail('user@example.com')).toEqual({ valid: true });
  });
});

describe('validatePassword', () => {
  it('rejects a missing password', () => {
    expect(validatePassword(undefined)).toEqual({
      valid: false,
      status: 400,
      message: 'Password is required',
    });
  });

  it('rejects a password shorter than the minimum length', () => {
    const result = validatePassword('short1');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.status).toBe(400);
      expect(result.message).toMatch(/8 characters/i);
    }
  });

  it('accepts a password meeting the minimum length', () => {
    expect(validatePassword('longenough')).toEqual({ valid: true });
  });
});

describe('validateRole', () => {
  it('accepts USER, EDITOR, and ADMIN', () => {
    expect(validateRole('USER')).toEqual({ valid: true });
    expect(validateRole('EDITOR')).toEqual({ valid: true });
    expect(validateRole('ADMIN')).toEqual({ valid: true });
  });

  it('accepts an undefined role (caller applies a default)', () => {
    expect(validateRole(undefined)).toEqual({ valid: true });
  });

  it('rejects an unknown role', () => {
    const result = validateRole('SUPERUSER');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.status).toBe(400);
    }
  });
});
