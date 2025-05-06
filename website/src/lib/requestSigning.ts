/**
 * Request Signing Utility
 * 
 * Provides cryptographic request signing to verify the authenticity of sensitive API requests.
 * This adds an additional layer of security for admin operations by ensuring that:
 * 1. Requests are not tampered with in transit
 * 2. Requests cannot be forged by attackers who don't possess the secret key
 * 3. Requests cannot be replayed (nonce + timestamp validation)
 */

import { createHmac, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/middleware/securityHeaders';

// Secret used for signing (should be in environment variables)
const SIGNING_SECRET = process.env.API_SIGNING_SECRET || 'your-signing-secret-change-in-production';

// Max age of a request signature (5 minutes)
const MAX_SIGNATURE_AGE = 5 * 60 * 1000; // 5 minutes in milliseconds

// Store used nonces to prevent replay attacks (in-memory, would use Redis in production)
// Format: { nonce: expirationTimestamp }
const usedNonces: Record<string, number> = {};

// Clean up expired nonces periodically
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiration] of Object.entries(usedNonces)) {
    if (expiration < now) {
      delete usedNonces[nonce];
    }
  }
}, 60 * 1000); // Clean up every minute

/**
 * Generate a unique nonce for request signing
 * @returns Unique random string
 */
export function generateNonce(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Sign a request payload to verify its authenticity
 * @param payload Object to sign
 * @param timestamp Timestamp of the request
 * @param nonce Unique nonce to prevent replay attacks
 * @returns HMAC signature of the request
 */
export function signRequest(
  payload: any,
  timestamp: number = Date.now(),
  nonce: string = generateNonce()
): { signature: string; timestamp: number; nonce: string } {
  // Create a normalized string of the payload
  const payloadStr = typeof payload === 'string' 
    ? payload 
    : JSON.stringify(payload);

  // Create the string to sign
  const stringToSign = `${payloadStr}:${timestamp}:${nonce}`;

  // Create HMAC signature using SHA-256
  const signature = createHmac('sha256', SIGNING_SECRET)
    .update(stringToSign)
    .digest('hex');

  return {
    signature,
    timestamp,
    nonce
  };
}

/**
 * Verify a request signature to ensure authenticity
 * @param payload Request payload
 * @param signature Signature to verify
 * @param timestamp Timestamp when the signature was created
 * @param nonce Unique nonce to prevent replay attacks
 * @returns True if signature is valid, false otherwise
 */
export function verifySignature(
  payload: any,
  signature: string,
  timestamp: number,
  nonce: string
): boolean {
  // Check if timestamp is too old (prevents replay attacks)
  const now = Date.now();
  if (now - timestamp > MAX_SIGNATURE_AGE) {
    return false;
  }

  // Check if nonce has been used before (prevents replay attacks)
  if (usedNonces[nonce]) {
    return false;
  }

  // Calculate the expected signature
  const expectedSignature = signRequest(payload, timestamp, nonce).signature;

  // Store nonce to prevent replay attacks
  usedNonces[nonce] = now + MAX_SIGNATURE_AGE;

  // Compare calculated signature with provided signature (constant-time comparison)
  return timingSafeEqual(expectedSignature, signature);
}

/**
 * Implements a timing-safe comparison of two strings
 * Prevents timing attacks on signature validation
 * @param a First string to compare
 * @param b Second string to compare
 * @returns True if strings are equal, false otherwise
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Middleware to verify request signatures for admin API routes
 * @param req NextRequest object
 * @returns NextResponse with error if signature is invalid, null if valid
 */
export function verifyRequestSignature(req: NextRequest): NextResponse | null {
  // Skip verification for non-mutation requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method || '')) {
    return null;
  }

  // Get signature components from headers
  const signature = req.headers.get('X-API-Signature');
  const timestamp = req.headers.get('X-API-Timestamp');
  const nonce = req.headers.get('X-API-Nonce');

  // If any component is missing, fail verification
  if (!signature || !timestamp || !nonce) {
    return createErrorResponse('Missing required signature headers', 401);
  }

  // Parse the request body
  let body;
  try {
    body = req.body ? req.body : {};
  } catch (error) {
    return createErrorResponse('Invalid request body', 400);
  }

  // Verify the signature
  const isValid = verifySignature(
    body,
    signature,
    parseInt(timestamp, 10),
    nonce
  );

  if (!isValid) {
    return createErrorResponse('Invalid request signature', 401);
  }

  // Signature is valid
  return null;
}

/**
 * Helper function to create standardized error responses
 * @param message Error message
 * @param status HTTP status code
 * @returns NextResponse with error message and security headers
 */
function createErrorResponse(message: string, status: number = 400): NextResponse {
  const response = NextResponse.json(
    { success: false, message },
    { status }
  );
  return applySecurityHeaders(response);
}
