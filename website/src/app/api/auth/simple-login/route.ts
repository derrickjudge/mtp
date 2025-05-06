/**
 * Simple Login API Endpoint
 * A secure approach to authentication with HTTP-only cookies
 * 
 * Security features:
 * - HTTP-only cookies for token storage
 * - CSRF protection
 * - Rate limiting
 * - Input validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// Using mock authentication for development and testing
import { authenticateUser } from '@/auth/services/mockAuthService';
import { createRateLimit } from '@/lib/enhancedRateLimit';
import { validateData } from '@/lib/validation';
import { authSchemas } from '@/lib/validationSchemas';
import { sanitizeInput } from '@/lib/validation';
import { trackLoginAttempt, recordFailedAttempt, resetFailedAttempts } from '@/lib/failedLoginTracker';

// Environment variables (should be properly validated in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const CSRF_SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-key-change-in-production';

// Create a rate limiter specifically for authentication
const authRateLimit = createRateLimit('STRICT');

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting first
    const rateLimitResult = await authRateLimit.check(req);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, message: `Rate limit exceeded. Please try again in ${Math.ceil(rateLimitResult.reset - Date.now()) / 1000} seconds.` }, 
        { status: 429 }
      );
    }
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      return NextResponse.json({ success: false, message: 'Invalid request format' }, { status: 400 });
    }
    
    // Validate request against schema
    const validationResult = validateData(requestBody, authSchemas.login);
    if (!validationResult.valid) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.errors
      }, { status: 400 });
    }
    
    // Extract and sanitize credentials
    const username = sanitizeInput(requestBody.username);
    const { password } = requestBody;
    
    // Check if login is allowed or if account is locked out
    const loginAttemptStatus = trackLoginAttempt(req, username);
    if (!loginAttemptStatus.allowed) {
      const lockoutMinutes = Math.floor(loginAttemptStatus.lockoutRemaining / 60000);
      const lockoutSeconds = Math.floor((loginAttemptStatus.lockoutRemaining % 60000) / 1000);
      
      return NextResponse.json({
        success: false,
        message: `Account locked due to too many failed attempts. Please try again in ${lockoutMinutes}m ${lockoutSeconds}s.`
      }, { status: 429 });
    }

    console.log(`[SIMPLE-LOGIN] Authentication attempt for user: ${username}`);
    
    try {
      // Authenticate user using mock service (with proper credentials object)
      const result = await authenticateUser({ username, password });
      
      // Reset failed attempt counters on successful login
      resetFailedAttempts(req, username);
      await authRateLimit.resetFailures(req);
      
      // Generate a CSRF token for protection against CSRF attacks
      const csrfToken = result.csrfToken || crypto.randomBytes(16).toString('hex');
      const csrfHash = crypto.createHash('sha256').update(`${csrfToken}${CSRF_SECRET}`).digest('hex');
      
      // Get the tokens from the result
      const token = result.accessToken;
      const refreshToken = result.refreshToken;
      
      console.log(`[SIMPLE-LOGIN] Authentication successful for ${username}`);
      console.log(`[SIMPLE-LOGIN] Token generated`);
      
      // Create a response
      const response = NextResponse.json({
        success: true,
        user: {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role
        },
        csrfToken, // Send CSRF token to client (will be needed for state-changing requests)
        message: 'Login successful'
      });
      
      // Set the main auth token as HTTP-only cookie
      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 4 // 4 hours in seconds
      });
      
      // Set refresh token as HTTP-only cookie
      response.cookies.set({
        name: 'refresh_token',
        value: refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days in seconds
      });
      
      // Set CSRF token as non-HTTP-only cookie so JavaScript can access it
      response.cookies.set({
        name: 'csrf_token',
        value: csrfToken,
        httpOnly: false, // Accessible to JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', 
        path: '/',
        maxAge: 60 * 60 * 4 // 4 hours in seconds
      });
      
      console.log(`[SIMPLE-LOGIN] Cookie set in response`);
      
      return response;
      
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Record failed attempt
      const failedStatus = recordFailedAttempt(req, username);
      await authRateLimit.recordFailure(req);
      
      // Check if account is locked
      if (error.message && error.message.includes('Account locked')) {
        return NextResponse.json({
          success: false,
          message: error.message
        }, { status: 429 });
      }
      
      // Return invalid credentials message
      return NextResponse.json({ 
        success: false, 
        message: `Invalid credentials. ${failedStatus?.attemptsRemaining || 'Multiple'} attempts remaining before account lockout.` 
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred during login' 
    }, { status: 500 });
  }
}
