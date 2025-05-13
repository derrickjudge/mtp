/**
 * Mock Secure Authentication Module for Tests
 * 
 * Provides mock implementations of secure authentication functions
 */

// Mock user data
const mockUser = {
  id: 1,
  username: 'admin',
  role: 'admin',
  email: 'admin@example.com'
};

// Mock tokens
const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  csrfToken: 'mock-csrf-token'
};

// Mock token verification
const verifyAccessToken = jest.fn().mockImplementation(() => ({
  sub: mockUser.id,
  username: mockUser.username,
  role: mockUser.role,
  jti: 'mock-token-id',
  csrf: 'mock-csrf-hash'
}));

const verifyRefreshToken = jest.fn().mockImplementation(() => ({
  sub: mockUser.id,
  username: mockUser.username,
  role: mockUser.role,
  jti: 'mock-token-id',
  tokenType: 'refresh'
}));

// Mock token generation
const generateTokens = jest.fn().mockImplementation(() => ({ ...mockTokens }));

// Mock CSRF token handling
const generateCsrfToken = jest.fn().mockImplementation(() => 'mock-csrf-token');
const hashCsrfToken = jest.fn().mockImplementation(() => 'mock-csrf-hash');
const validateCsrfToken = jest.fn().mockImplementation(() => true);

// Mock cookie handling
const setAuthCookies = jest.fn().mockImplementation(response => response);
const clearAuthCookies = jest.fn().mockImplementation(response => response);
const getUserFromRequest = jest.fn().mockImplementation(() => ({ ...mockUser }));

// Mock login/logout responses
const createLoginResponse = jest.fn().mockImplementation(() => ({
  status: 200,
  json: () => ({
    success: true,
    user: { ...mockUser }
  })
}));

const createLogoutResponse = jest.fn().mockImplementation(() => ({
  status: 200,
  json: () => ({
    success: true,
    message: 'Logged out successfully'
  })
}));

// Mock token refresh handling
const handleTokenRefresh = jest.fn().mockImplementation(() => ({
  status: 200,
  json: () => ({
    success: true,
    message: 'Token refreshed successfully'
  })
}));

// Mock auth middlewares
const requireAuth = jest.fn().mockImplementation(() => null);
const requireRole = jest.fn().mockImplementation(() => null);

// Helper to simulate auth failure
const mockAuthFailure = () => {
  requireAuth.mockImplementation(() => ({
    status: 401,
    json: () => ({
      success: false,
      message: 'Authentication required'
    })
  }));
  
  requireRole.mockImplementation(() => ({
    status: 403,
    json: () => ({
      success: false,
      message: 'Insufficient permissions'
    })
  }));
  
  getUserFromRequest.mockImplementation(() => null);
};

// Helper to reset mocks
const resetMocks = () => {
  verifyAccessToken.mockClear();
  verifyRefreshToken.mockClear();
  generateTokens.mockClear();
  generateCsrfToken.mockClear();
  hashCsrfToken.mockClear();
  validateCsrfToken.mockClear();
  setAuthCookies.mockClear();
  clearAuthCookies.mockClear();
  getUserFromRequest.mockClear();
  createLoginResponse.mockClear();
  createLogoutResponse.mockClear();
  handleTokenRefresh.mockClear();
  requireAuth.mockClear();
  requireRole.mockClear();
  
  // Reset default implementations
  verifyAccessToken.mockImplementation(() => ({
    sub: mockUser.id,
    username: mockUser.username,
    role: mockUser.role,
    jti: 'mock-token-id',
    csrf: 'mock-csrf-hash'
  }));
  
  verifyRefreshToken.mockImplementation(() => ({
    sub: mockUser.id,
    username: mockUser.username,
    role: mockUser.role,
    jti: 'mock-token-id',
    tokenType: 'refresh'
  }));
  
  generateTokens.mockImplementation(() => ({ ...mockTokens }));
  generateCsrfToken.mockImplementation(() => 'mock-csrf-token');
  hashCsrfToken.mockImplementation(() => 'mock-csrf-hash');
  validateCsrfToken.mockImplementation(() => true);
  setAuthCookies.mockImplementation(response => response);
  clearAuthCookies.mockImplementation(response => response);
  getUserFromRequest.mockImplementation(() => ({ ...mockUser }));
  
  requireAuth.mockImplementation(() => null);
  requireRole.mockImplementation(() => null);
};

// Initialize with the default implementations
resetMocks();

module.exports = {
  verifyAccessToken,
  verifyRefreshToken,
  generateTokens,
  generateCsrfToken,
  hashCsrfToken,
  validateCsrfToken,
  setAuthCookies,
  clearAuthCookies,
  getUserFromRequest,
  createLoginResponse,
  createLogoutResponse,
  handleTokenRefresh,
  requireAuth,
  requireRole,
  mockUser,
  mockTokens,
  mockAuthFailure,
  resetMocks
};

// Default export for modules using import syntax
module.exports.default = module.exports;
