/**
 * Mock Rate Limiter Module for Tests
 * 
 * This file provides a mock implementation of the rate limiter module 
 * to allow tests to run without actual rate limiting.
 */

// Mock successful rate limit check
const mockSuccessCheck = {
  success: true,
  limit: 60,
  remaining: 59,
  reset: Date.now() + 60000
};

// Mock rate limit exceeded
const mockLimitExceeded = {
  success: false,
  limit: 60,
  remaining: 0,
  reset: Date.now() + 60000
};

// Default mock implementation returns success
const rateLimiter = jest.fn().mockResolvedValue(mockSuccessCheck);

// Function to create a rate limiter with custom configuration
const rateLimit = jest.fn().mockImplementation(() => {
  return {
    check: jest.fn().mockResolvedValue(mockSuccessCheck)
  };
});

// Function to mock a rate limit exceeded condition
const mockRateLimitExceeded = () => {
  rateLimiter.mockResolvedValue(mockLimitExceeded);
  rateLimit.mockImplementation(() => {
    return {
      check: jest.fn().mockResolvedValue(mockLimitExceeded)
    };
  });
};

// Function to reset mocks
const resetMocks = () => {
  rateLimiter.mockClear();
  rateLimit.mockClear();
  
  rateLimiter.mockResolvedValue(mockSuccessCheck);
  rateLimit.mockImplementation(() => {
    return {
      check: jest.fn().mockResolvedValue(mockSuccessCheck)
    };
  });
};

module.exports = {
  rateLimiter,
  rateLimit,
  mockRateLimitExceeded,
  resetMocks,
  mockSuccessCheck,
  mockLimitExceeded
};
