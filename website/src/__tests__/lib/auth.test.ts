import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { generateToken, verifyToken } from '../../lib/auth';

// Mock the cookies functions from next/headers
jest.mock('next/headers', () => ({
  cookies: () => ({
    set: jest.fn(),
    get: jest.fn().mockReturnValue({ value: 'test-token' }),
    delete: jest.fn(),
  }),
}));

describe('Auth Utility Tests', () => {
  // Setup fake timers
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  const mockPayload = {
    userId: '123',
    username: 'testuser',
    role: 'admin'
  };

  // Test token generation
  it('should generate a valid JWT token', () => {
    const token = generateToken(mockPayload);
    
    // Verify token is a string
    expect(typeof token).toBe('string');
    
    // Decode token and check payload
    const decoded = jwt.decode(token);
    expect(decoded).toBeDefined();
    
    if (decoded && typeof decoded === 'object') {
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.username).toBe(mockPayload.username);
      expect(decoded.role).toBe(mockPayload.role);
      // Should have an expiration
      expect(decoded.exp).toBeDefined();
    }
  });

  // Test token verification
  it('should verify a valid token', () => {
    // Generate a token
    const token = generateToken(mockPayload);
    
    // Verify it
    const verified = verifyToken(token);
    
    expect(verified).toBeDefined();
    expect(verified.userId).toBe(mockPayload.userId);
    expect(verified.username).toBe(mockPayload.username);
    expect(verified.role).toBe(mockPayload.role);
  });

  // Test invalid token verification
  it('should return null for an invalid token', () => {
    // Invalid token
    const invalidToken = 'invalid.token.here';
    
    const verified = verifyToken(invalidToken);
    
    expect(verified).toBeNull();
  });

  // Test expired token verification
  it('should return null for an expired token', () => {
    // Create a token that's already expired
    const expiredToken = jwt.sign(
      mockPayload,
      process.env.JWT_SECRET || 'mtp_collective_secret_key',
      { expiresIn: '0s' } // Expired immediately
    );
    
    // Wait a moment to ensure it's expired
    jest.advanceTimersByTime(10);
    
    const verified = verifyToken(expiredToken);
    
    expect(verified).toBeNull();
  });
});
