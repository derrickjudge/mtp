/**
 * Authentication Utilities - JavaScript Compatibility Layer
 * This file provides CommonJS exports of the auth functions for tests
 */

const jwt = require('jsonwebtoken');
const { NextResponse } = require('next/server');

// Secret key for JWT - should be in .env file in production
const JWT_SECRET = process.env.JWT_SECRET || 'mtp_collective_secret_key';
const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '24h'; // Token valid for 24 hours by default

/**
 * Generate a JWT token for authenticated users
 * @param {Object} payload - Data to encode in the token
 * @param {string|number} payload.userId - User ID
 * @param {string} payload.username - Username
 * @param {string} payload.role - User role
 * @returns {string} JWT token string
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * Verify a JWT token and return the decoded payload
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Set authentication token as HTTP-only cookie
 * Mock implementation for tests
 * @param {string} token - JWT token
 */
function setAuthCookie(token) {
  // This is a mock for tests - actual implementation uses next/headers
  console.log('Mock setAuthCookie called');
}

/**
 * Clear authentication cookie
 * Mock implementation for tests
 */
function clearAuthCookie() {
  // This is a mock for tests - actual implementation uses next/headers
  console.log('Mock clearAuthCookie called');
}

/**
 * Get user from token in request
 * @param {Object} req - NextRequest object
 * @returns {Object|null} User data from token or null
 */
function getUserFromToken(req) {
  // For tests, check for auth_token in cookies
  const token = req.cookies?.get?.('auth_token')?.value;
  if (!token) return null;
  
  return verifyToken(token);
}

/**
 * Middleware to check if user is authenticated
 * @param {Object} req - NextRequest object
 * @returns {Object|null} NextResponse or redirects to login
 */
function isAuthenticated(req) {
  const user = getUserFromToken(req);
  
  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  
  return null;
}

/**
 * Middleware to check if user has admin role
 * @param {Object} req - NextRequest object
 * @returns {Object|null} NextResponse or redirects to unauthorized page
 */
function isAdmin(req) {
  const user = getUserFromToken(req);
  
  if (!user || user.role !== 'admin') {
    return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
  }
  
  return null;
}

// Export individual functions to allow direct imports
module.exports = {
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  getUserFromToken,
  isAuthenticated,
  isAdmin,
  // Add default export to match TypeScript's export default
  default: {
    generateToken,
    verifyToken,
    setAuthCookie,
    clearAuthCookie,
    getUserFromToken,
    isAuthenticated,
    isAdmin,
  }
};
