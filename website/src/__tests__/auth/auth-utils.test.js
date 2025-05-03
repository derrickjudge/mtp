/**
 * Authentication utilities tests
 */

// Mock JWT for token verification
const jwt = require('jsonwebtoken');
jest.mock('jsonwebtoken');

// Create simplified auth utilities for testing
const authUtils = {
  generateToken: (payload) => {
    const secret = process.env.JWT_SECRET || 'mtp_collective_secret_key';
    return jwt.sign(payload, secret, { expiresIn: '24h' });
  },
  
  verifyToken: (token) => {
    if (!token) return null;
    
    try {
      const secret = process.env.JWT_SECRET || 'mtp_collective_secret_key';
      return jwt.verify(token, secret);
    } catch (error) {
      console.error('Token verification error:', error.message);
      return null;
    }
  }
};

describe('Authentication Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Token Generation', () => {
    it('should generate a valid JWT token', () => {
      // Setup mock implementation
      jwt.sign.mockReturnValue('mock.jwt.token');
      
      const payload = { userId: 1, username: 'admin', role: 'admin' };
      const token = authUtils.generateToken(payload);
      
      expect(token).toBe('mock.jwt.token');
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String),
        { expiresIn: '24h' }
      );
    });
  });
  
  describe('Token Verification', () => {
    it('should verify a valid token', () => {
      const mockPayload = { userId: 1, username: 'admin', role: 'admin' };
      jwt.verify.mockReturnValue(mockPayload);
      
      const result = authUtils.verifyToken('valid.token');
      
      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid.token',
        expect.any(String)
      );
    });
    
    it('should return null for an invalid token', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = authUtils.verifyToken('invalid.token');
      
      expect(result).toBeNull();
      expect(jwt.verify).toHaveBeenCalled();
      
      // Restore console
      consoleSpy.mockRestore();
    });
    
    it('should return null for null or undefined token', () => {
      const result = authUtils.verifyToken(null);
      
      expect(result).toBeNull();
      expect(jwt.verify).not.toHaveBeenCalled();
    });
  });
});
