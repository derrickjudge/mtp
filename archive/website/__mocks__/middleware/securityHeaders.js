/**
 * Mock Security Headers Middleware for Tests
 * 
 * This file provides mock implementations of security header functions for testing
 */

// Mock implementation that simply returns the response
const applySecurityHeaders = jest.fn().mockImplementation((response) => {
  return response;
});

// Function to add specific headers for testing
const addCustomHeaders = jest.fn().mockImplementation((response, headers) => {
  return response;
});

// Reset mocks to default implementation
const resetMocks = () => {
  applySecurityHeaders.mockClear();
  addCustomHeaders.mockClear();
  
  applySecurityHeaders.mockImplementation((response) => {
    return response;
  });
  
  addCustomHeaders.mockImplementation((response, headers) => {
    return response;
  });
};

module.exports = {
  applySecurityHeaders,
  addCustomHeaders,
  resetMocks
};

// Default export for modules that use import syntax
module.exports.default = module.exports;
