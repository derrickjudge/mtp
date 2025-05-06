/**
 * Mock Failed Login Tracker for Tests
 */

// Track login attempts with mock functionality
const loginAttempts = new Map();

const trackLoginAttempt = jest.fn().mockImplementation(() => {
  return {
    allowed: true,
    attemptCount: 0,
    maxAttempts: 3,
    lockoutRemaining: 0,
    lockoutEnds: null
  };
});

const recordFailedAttempt = jest.fn().mockImplementation(() => {
  return {
    allowed: true,
    attemptCount: 1,
    attemptsRemaining: 2,
    maxAttempts: 3,
    lockoutRemaining: 0,
    lockoutEnds: null
  };
});

const resetFailedAttempts = jest.fn();

// Helper to simulate a locked account
const mockAccountLocked = () => {
  const now = Date.now();
  const lockoutEnds = now + 5 * 60 * 1000; // 5 minutes
  
  trackLoginAttempt.mockImplementation(() => {
    return {
      allowed: false,
      attemptCount: 3,
      maxAttempts: 3,
      lockoutRemaining: lockoutEnds - now,
      lockoutEnds
    };
  });
  
  recordFailedAttempt.mockImplementation(() => {
    return {
      allowed: false,
      attemptCount: 3,
      attemptsRemaining: 0,
      maxAttempts: 3,
      lockoutRemaining: lockoutEnds - now,
      lockoutEnds
    };
  });
};

// Reset mocks to default implementation
const resetMocks = () => {
  trackLoginAttempt.mockClear();
  recordFailedAttempt.mockClear();
  resetFailedAttempts.mockClear();
  
  trackLoginAttempt.mockImplementation(() => {
    return {
      allowed: true,
      attemptCount: 0,
      maxAttempts: 3,
      lockoutRemaining: 0,
      lockoutEnds: null
    };
  });
  
  recordFailedAttempt.mockImplementation(() => {
    return {
      allowed: true,
      attemptCount: 1,
      attemptsRemaining: 2,
      maxAttempts: 3,
      lockoutRemaining: 0,
      lockoutEnds: null
    };
  });
};

module.exports = {
  trackLoginAttempt,
  recordFailedAttempt,
  resetFailedAttempts,
  mockAccountLocked,
  resetMocks
};
