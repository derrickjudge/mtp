import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Secret key for JWT - should be in .env file in production
const JWT_SECRET = process.env.JWT_SECRET || 'mtp_collective_secret_key';
const TOKEN_EXPIRY = '24h'; // Token valid for 24 hours

/**
 * Generate a JWT token for authenticated users
 * @param payload - Data to encode in the token
 * @returns JWT token string
 */
export const generateToken = (payload: { userId: string; username: string; role: string }): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
};

/**
 * Verify a JWT token and return the decoded payload
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): any | null => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Set authentication token as HTTP-only cookie
 * @param response - NextResponse object
 * @param token - JWT token
 * @returns NextResponse with cookie set
 */
export const setAuthCookie = (token: string): void => {
  cookies().set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours in seconds
    path: '/',
    sameSite: 'strict',
  });
};

/**
 * Clear authentication cookie
 * @returns NextResponse with cookie cleared
 */
export const clearAuthCookie = (): void => {
  cookies().delete('auth_token');
};

/**
 * Get user from token in request
 * @param req - NextRequest object
 * @returns User data from token or null
 */
export const getUserFromToken = (req: NextRequest): any | null => {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  
  return verifyToken(token);
};

/**
 * Middleware to check if user is authenticated
 * @param req - NextRequest object
 * @returns NextResponse or redirects to login
 */
export const isAuthenticated = (req: NextRequest): NextResponse | null => {
  const user = getUserFromToken(req);
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return null;
};

/**
 * Middleware to check if user has admin role
 * @param req - NextRequest object
 * @returns NextResponse or redirects to unauthorized page
 */
export const isAdmin = (req: NextRequest): NextResponse | null => {
  const user = getUserFromToken(req);
  
  if (!user || user.role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }
  
  return null;
};

export default {
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  getUserFromToken,
  isAuthenticated,
  isAdmin,
};
