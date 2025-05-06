/**
 * Mock Validation Library for Tests
 * 
 * Provides mock implementations of validation functions for testing
 */

// Mock implementation that simply returns null (no validation errors)
const validateRequest = jest.fn().mockImplementation(() => null);

// Mock implementation for sanitizing objects
const sanitizeObject = jest.fn().mockImplementation(obj => obj);

// Mock implementation for sanitizing strings
const sanitizeString = jest.fn().mockImplementation(str => str);

// Mock implementation for validation error response
const validationErrorResponse = jest.fn().mockImplementation(errors => ({
  status: 400,
  json: () => ({
    success: false,
    message: 'Validation failed',
    errors
  })
}));

// Mock for generating a standard validation schema
const createValidationSchema = jest.fn().mockImplementation(fields => fields);

// Helper to simulate validation errors
const mockValidationError = (errors = { field: ['Error message'] }) => {
  validateRequest.mockImplementation(() => errors);
};

// Helper to reset mocks
const resetMocks = () => {
  validateRequest.mockClear();
  sanitizeObject.mockClear();
  sanitizeString.mockClear();
  validationErrorResponse.mockClear();
  createValidationSchema.mockClear();
  
  validateRequest.mockImplementation(() => null);
  sanitizeObject.mockImplementation(obj => obj);
  sanitizeString.mockImplementation(str => str);
  validationErrorResponse.mockImplementation(errors => ({
    status: 400,
    json: () => ({
      success: false,
      message: 'Validation failed',
      errors
    })
  }));
};

module.exports = {
  validateRequest,
  sanitizeObject,
  sanitizeString,
  validationErrorResponse,
  createValidationSchema,
  mockValidationError,
  resetMocks
};

// Default export for modules using import syntax
module.exports.default = module.exports;
