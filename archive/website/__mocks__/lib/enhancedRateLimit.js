/**
 * Mock Enhanced Rate Limiter for Tests
 * 
 * Provides a consistent, clean mock implementation of our enhanced rate limiter
 */

// Mock successful rate limit check result
const successResult = {
  success: true,
  limit: 60,
  remaining: 59,
  reset: Date.now() + 60000
};

// Mock rate limit exceeded result
const limitExceededResult = {
  success: false,
  limit: 60,
  remaining: 0,
  reset: Date.now() + 60000
};

// Create a mock RateLimit class with all the methods from our enhanced implementation
class RateLimit {
  constructor(config) {
    this.config = config || { maxRequests: 60, windowMs: 60000 };
  }
  
  // Default check implementation returns success
  async check(req) {
    return { ...successResult };
  }
  
  // Record a failed attempt
  async recordFailure(req) {
    return true;
  }
  
  // Reset failures for a request
  async resetFailures(req) {
    return true;
  }
  
  // Create a rate-limited response
  async createLimitedResponse(req, result) {
    return {
      status: 429,
      json: () => ({
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
      })
    };
  }
}

// Mock for the createRateLimit function that's exported
const createRateLimit = jest.fn().mockImplementation((typeOrConfig) => {
  // Handle both string types and config objects
  return new RateLimit(
    typeof typeOrConfig === 'object' ? typeOrConfig : undefined
  );
});

// Helper to simulate rate limit exceeded
const mockRateLimitExceeded = () => {
  RateLimit.prototype.check = jest.fn().mockResolvedValue({ ...limitExceededResult });
};

// Helper to reset mocks
const resetMocks = () => {
  createRateLimit.mockClear();
  RateLimit.prototype.check = jest.fn().mockResolvedValue({ ...successResult });
  RateLimit.prototype.recordFailure = jest.fn().mockResolvedValue(true);
  RateLimit.prototype.resetFailures = jest.fn().mockResolvedValue(true);
};

// Reset mocks initially
resetMocks();

module.exports = {
  createRateLimit,
  mockRateLimitExceeded,
  resetMocks,
  successResult,
  limitExceededResult
};

// Default export for modules using import syntax
module.exports.default = module.exports;
