/**
 * Mock AuthService for Tests
 * 
 * This file mocks the AuthService to allow tests to run without TypeScript parsing issues.
 */

const authService = {
  authenticateUser: jest.fn().mockImplementation(async (username, password) => {
    if (username === 'admin' && password === 'password123') {
      return {
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin'
        },
        token: 'mock-jwt-token'
      };
    }
    return null;
  }),
  
  getUserById: jest.fn().mockImplementation(async (id) => {
    if (id === 1) {
      return {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      };
    }
    return null;
  }),
  
  registerUser: jest.fn().mockImplementation(async (userData) => {
    return {
      id: 2,
      ...userData,
      password: undefined // Don't return password
    };
  })
};

module.exports = authService;
module.exports.default = authService;
