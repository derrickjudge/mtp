/**
 * Mock Auth Module for Tests
 * 
 * This file provides mock implementation of auth functions for testing
 */

// Mock auth token handling
const mockToken = 'mock-jwt-token.with.signature';
const mockUser = {
  id: 1,
  username: 'admin',
  role: 'admin'
};

// Mock JWT verification
const verifyToken = jest.fn().mockImplementation((token) => {
  if (token === mockToken) {
    return mockUser;
  }
  return null;
});

// Mock JWT generation
const generateToken = jest.fn().mockImplementation((user) => {
  return mockToken;
});

// Mock user extraction from token
const getUserFromToken = jest.fn().mockImplementation((token) => {
  if (token === mockToken) {
    return mockUser;
  }
  return null;
});

// Mock cookie handling
const setAuthCookie = jest.fn();
const clearAuthCookie = jest.fn();
const getAuthCookie = jest.fn().mockImplementation(() => mockToken);

// Helper to simulate invalid token
const mockInvalidToken = () => {
  verifyToken.mockImplementation(() => null);
  getUserFromToken.mockImplementation(() => null);
};

// Reset mocks to default implementation
const resetMocks = () => {
  verifyToken.mockClear();
  generateToken.mockClear();
  getUserFromToken.mockClear();
  setAuthCookie.mockClear();
  clearAuthCookie.mockClear();
  getAuthCookie.mockClear();
  
  verifyToken.mockImplementation((token) => {
    if (token === mockToken) {
      return mockUser;
    }
    return null;
  });
  
  getUserFromToken.mockImplementation((token) => {
    if (token === mockToken) {
      return mockUser;
    }
    return null;
  });
  
  getAuthCookie.mockImplementation(() => mockToken);
};

module.exports = {
  verifyToken,
  generateToken,
  getUserFromToken,
  setAuthCookie,
  clearAuthCookie,
  getAuthCookie,
  mockToken,
  mockUser,
  mockInvalidToken,
  resetMocks
};

// Default export for modules that use import syntax
module.exports.default = module.exports;
