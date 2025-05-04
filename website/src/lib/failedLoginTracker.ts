/**
 * Failed Login Tracker
 * 
 * Tracks failed login attempts and enforces lockout periods
 * after a certain number of failed attempts
 */

import { NextRequest } from 'next/server';

interface FailedLoginResult {
  allowed: boolean;      // Whether login attempt is allowed
  attemptsRemaining: number;  // Number of attempts remaining before lockout
  lockoutRemaining: number;   // Milliseconds remaining in lockout period (0 if not locked)
  lockoutEnds: number;        // Timestamp when lockout ends (0 if not locked)
}

// In-memory store for tracking failed login attempts
// In production, this should be replaced with Redis or similar
const failedLogins = new Map<string, {
  attempts: number;    // Number of failed attempts
  lastFailure: number; // Timestamp of the last failure
  lockoutUntil: number; // Timestamp when lockout ends
}>();

// Constants
const MAX_FAILED_ATTEMPTS = 3;               // Max failed attempts before lockout
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;   // Lockout duration: 5 minutes
const ATTEMPT_RESET_PERIOD_MS = 30 * 60 * 1000; // Reset counter after 30 minutes of no failures

/**
 * Tracks failed login attempts and enforces lockout periods
 * 
 * @param req The incoming request
 * @param username The username being used for login
 * @returns Object with login attempt status
 */
export function trackLoginAttempt(
  req: NextRequest,
  username: string
): FailedLoginResult {
  // Get client IP
  const ip = getClientIp(req);
  
  // Create a unique key combining IP and username
  // This prevents both IP-based and username-based attacks
  const key = `${ip}:${username}`.toLowerCase();
  
  const now = Date.now();
  
  // Get existing tracking data or create new entry
  const loginData = failedLogins.get(key) || {
    attempts: 0,
    lastFailure: 0,
    lockoutUntil: 0
  };
  
  // Check if currently in lockout period
  if (loginData.lockoutUntil > now) {
    // Account is locked - calculate remaining lockout time
    const lockoutRemaining = loginData.lockoutUntil - now;
    
    return {
      allowed: false,
      attemptsRemaining: 0,
      lockoutRemaining,
      lockoutEnds: loginData.lockoutUntil
    };
  }
  
  // Check if we should reset the attempt counter
  // (if it's been a long time since the last failure)
  if (loginData.lastFailure > 0 && now - loginData.lastFailure > ATTEMPT_RESET_PERIOD_MS) {
    loginData.attempts = 0;
  }
  
  // If we've reached here, the user is allowed to attempt login
  return {
    allowed: true,
    attemptsRemaining: MAX_FAILED_ATTEMPTS - loginData.attempts,
    lockoutRemaining: 0,
    lockoutEnds: 0
  };
}

/**
 * Records a failed login attempt and updates tracking data
 * 
 * @param req The incoming request
 * @param username The username that failed to login
 * @returns Updated login attempt status
 */
export function recordFailedAttempt(
  req: NextRequest,
  username: string
): FailedLoginResult {
  const ip = getClientIp(req);
  const key = `${ip}:${username}`.toLowerCase();
  const now = Date.now();
  
  // Get existing tracking data or create new entry
  const loginData = failedLogins.get(key) || {
    attempts: 0,
    lastFailure: 0,
    lockoutUntil: 0
  };
  
  // If we're in a lockout period, just return the current status
  if (loginData.lockoutUntil > now) {
    const lockoutRemaining = loginData.lockoutUntil - now;
    
    return {
      allowed: false,
      attemptsRemaining: 0,
      lockoutRemaining,
      lockoutEnds: loginData.lockoutUntil
    };
  }
  
  // Update failed attempts
  loginData.attempts += 1;
  loginData.lastFailure = now;
  
  // Check if we need to impose a lockout
  if (loginData.attempts >= MAX_FAILED_ATTEMPTS) {
    loginData.lockoutUntil = now + LOCKOUT_DURATION_MS;
    
    // Update store
    failedLogins.set(key, loginData);
    
    return {
      allowed: false,
      attemptsRemaining: 0,
      lockoutRemaining: LOCKOUT_DURATION_MS,
      lockoutEnds: loginData.lockoutUntil
    };
  }
  
  // Update store
  failedLogins.set(key, loginData);
  
  // Return updated status
  return {
    allowed: true,
    attemptsRemaining: MAX_FAILED_ATTEMPTS - loginData.attempts,
    lockoutRemaining: 0,
    lockoutEnds: 0
  };
}

/**
 * Resets failed login attempts for a username/IP combination
 * Called after successful login
 * 
 * @param req The incoming request
 * @param username The username that successfully logged in
 */
export function resetFailedAttempts(
  req: NextRequest,
  username: string
): void {
  const ip = getClientIp(req);
  const key = `${ip}:${username}`.toLowerCase();
  
  // Remove the tracking entry entirely
  failedLogins.delete(key);
}

// Helper function to get client IP
function getClientIp(req: NextRequest): string {
  let ip: string;
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    
    if (forwardedFor) {
      ip = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      ip = realIp.trim();
    } else {
      // NextRequest.ip may not be available in all Next.js versions
      // Use a fallback IP for development environments
      ip = '127.0.0.1';
    }
  } catch (e) {
    ip = '127.0.0.1';
  }
  return ip;
}

// Clean up mechanism to prevent memory leaks
let lastCleanup = Date.now();

export function cleanupFailedLogins(): void {
  const now = Date.now();
  
  // Only clean up every hour
  if (now - lastCleanup < 60 * 60 * 1000) {
    return;
  }
  
  lastCleanup = now;
  
  // Remove expired entries (lockouts expired and no recent failures)
  for (const [key, data] of failedLogins.entries()) {
    // If lockout has expired and last failure was over 1 hour ago
    if (data.lockoutUntil < now && now - data.lastFailure > 60 * 60 * 1000) {
      failedLogins.delete(key);
    }
  }
}

// Run cleanup periodically
setInterval(cleanupFailedLogins, 60 * 60 * 1000); // Hourly
