import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as db from '@/lib/database';
import bcrypt from 'bcryptjs';

// Secret key for JWT - should be in .env file in production
const JWT_SECRET = process.env.JWT_SECRET || 'mtp_collective_secret_key';
const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '24h'; // Token valid for 24 hours by default

// Define proper type for jwt Secret
type JwtSecret = string | Buffer;

/**
 * Generate a JWT token for authenticated users
 * @param payload - Data to encode in the token
 * @returns JWT token string
 */
export const generateToken = (payload: { userId: number; username: string; role: string }): string => {
  // Cast JWT_SECRET to JwtSecret to resolve TypeScript error
  return jwt.sign(payload, JWT_SECRET as JwtSecret, {
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
    // Cast JWT_SECRET to JwtSecret to resolve TypeScript error
    return jwt.verify(token, JWT_SECRET as JwtSecret);
  } catch (error) {
    return null;
  }
};

/**
 * Set authentication token as HTTP-only cookie
 * @param token - JWT token
 */
export const setAuthCookie = (token: string): void => {
  // Use synchronous cookie API for server components
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
 */
export const clearAuthCookie = (): void => {
  // Use synchronous cookie API for server components
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
    return NextResponse.redirect(new URL('/admin/login', req.url));
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
    return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
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
