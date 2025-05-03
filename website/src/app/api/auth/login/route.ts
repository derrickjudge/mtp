/**
 * Login API Endpoint
 * Authenticates users and returns a JWT token
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/services/authService';
import auth from '@/lib/auth';
import { rateLimiter } from '@/lib/rate-limiter';
import { setServerCookie } from './server-cookies';

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
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

    // Authenticate user
    const result = await authenticateUser(username, password);
    if (!result) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

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
