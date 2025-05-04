/**
 * Login API Endpoint
 * Authenticates users and returns a JWT token
 * 
 * Security features:
 * - General rate limiting for all requests
 * - Specific tracking of failed login attempts
 * - Account lockout after 3 failed attempts for 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/services/authService';
import auth from '@/lib/auth';
import { rateLimiter } from '@/lib/rate-limiter';
import { trackLoginAttempt, recordFailedAttempt, resetFailedAttempts } from '@/lib/failedLoginTracker';
import { setServerCookie } from './server-cookies';

export async function POST(req: NextRequest) {
  try {
    // Apply general rate limiting first
    const rateLimitResult = await rateLimiter(req);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get credentials from request body
    const { username, password } = await req.json();

    // Validate inputs
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // Check if login is allowed or if account is locked out due to failed attempts
    const loginAttemptStatus = trackLoginAttempt(req, username);
    if (!loginAttemptStatus.allowed) {
      // Account is locked - calculate lockout time in minutes and seconds
      const lockoutMinutes = Math.floor(loginAttemptStatus.lockoutRemaining / 60000);
      const lockoutSeconds = Math.floor((loginAttemptStatus.lockoutRemaining % 60000) / 1000);
      
      return NextResponse.json(
        { 
          message: `Account locked due to too many failed attempts. Please try again in ${lockoutMinutes}m ${lockoutSeconds}s.`,
          lockedUntil: loginAttemptStatus.lockoutEnds
        },
        { status: 429 }
      );
    }

    // Authenticate user
    const result = await authenticateUser(username, password);
    if (!result) {
      // Record failed attempt and get updated status
      const failedStatus = recordFailedAttempt(req, username);
      
      // If this failure triggered a lockout, inform the user
      if (!failedStatus.allowed) {
        const lockoutMinutes = Math.floor(failedStatus.lockoutRemaining / 60000);
        const lockoutSeconds = Math.floor((failedStatus.lockoutRemaining % 60000) / 1000);
        
        return NextResponse.json(
          { 
            message: `Account locked due to too many failed attempts. Please try again in ${lockoutMinutes}m ${lockoutSeconds}s.`,
            lockedUntil: failedStatus.lockoutEnds
          },
          { status: 429 }
        );
      }
      
      // Otherwise, inform the user of remaining attempts
      return NextResponse.json(
        { 
          message: `Invalid credentials. ${failedStatus.attemptsRemaining} attempts remaining before account lockout.` 
        },
        { status: 401 }
      );
    }
    
    // Login successful - reset any failed attempt counters
    resetFailedAttempts(req, username);

    // Set auth cookie using server-side cookie utility
    await setServerCookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours in seconds
      path: '/',
      sameSite: 'strict',
    });

    // Return user data (without password) and token
    return NextResponse.json({
      user: result.user,
      token: result.token
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error during login' },
      { status: 500 }
    );
  }
}
