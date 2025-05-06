/**
 * Authentication Service
 * Provides authentication business logic separated from API routes
 */
import { compare } from 'bcryptjs';
import { 
  AuthResult, 
  LoginCredentials, 
  TokenPair, 
  UserData 
} from '../types';
import { 
  generateTokenPair, 
  generateCsrfToken 
} from '../utils/tokens';
import { 
  AccountLockedError, 
  InvalidCredentialsError 
} from '../errors/AuthError';
import * as db from '@/lib/database';
import { authConfig } from '../config/authConfig';

// Track failed login attempts - in a production app this would be in a database or Redis
const failedLoginAttempts: Record<string, { count: number, timestamp: number }> = {};

/**
 * Authenticate a user with username/email and password
 * @param credentials - Login credentials (username/password)
 * @returns Authentication result with tokens and user data
 * @throws {InvalidCredentialsError} If credentials are invalid
 * @throws {AccountLockedError} If account is locked due to too many failed attempts
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<AuthResult> {
  const { username, password } = credentials;

  try {
    // Check for account lockout
    checkAccountLockout(username);

    // Find the user in the database
    const users = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, username]
    );

    // User not found
    if (!users || !Array.isArray(users) || users.length === 0) {
      recordFailedAttempt(username);
      throw new InvalidCredentialsError();
    }

    // User found - first result from query
    const user = users[0] as any;

    // Verify password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      recordFailedAttempt(username);
      throw new InvalidCredentialsError();
    }

    // Password is valid - clear failed attempts
    clearFailedAttempts(username);

    // Create user data object (without password)
    const userData: UserData = {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    };
    
    // Generate CSRF token
    const csrfToken = generateCsrfToken();
    
    // Generate token pair
    const tokens = generateTokenPair(userData, csrfToken);

    // Return authentication result
    return {
      user: userData,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      csrfToken
    };
  } catch (error) {
    // Re-throw authentication errors
    if (error instanceof InvalidCredentialsError || 
        error instanceof AccountLockedError) {
      throw error;
    }
    
    // Log other errors
    console.error('Authentication error:', error);
    throw new InvalidCredentialsError();
  }
}

/**
 * Check if an account is locked due to too many failed login attempts
 * @param username - Username to check
 * @throws {AccountLockedError} If account is locked
 */
function checkAccountLockout(username: string): void {
  const attempts = failedLoginAttempts[username];
  if (!attempts) return;

  const { count, timestamp } = attempts;
  const lockoutMs = authConfig.rateLimit.accountLockout.lockDuration;
  const now = Date.now();

  // If account is locked and lockout period hasn't expired
  if (count >= authConfig.rateLimit.accountLockout.maxAttempts && 
      now - timestamp < lockoutMs) {
    // Calculate remaining lockout time
    const remainingMs = lockoutMs - (now - timestamp);
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    
    throw new AccountLockedError(
      `Account locked due to too many failed attempts. Please try again in ${remainingMinutes} minutes.`,
      remainingMs
    );
  }

  // If lockout period has expired, reset the attempts
  if (now - timestamp >= lockoutMs) {
    clearFailedAttempts(username);
  }
}

/**
 * Record a failed login attempt
 * @param username - Username to record attempt for
 */
function recordFailedAttempt(username: string): void {
  const now = Date.now();
  
  if (!failedLoginAttempts[username]) {
    failedLoginAttempts[username] = { count: 1, timestamp: now };
  } else {
    failedLoginAttempts[username].count += 1;
    failedLoginAttempts[username].timestamp = now;
  }
}

/**
 * Clear failed login attempts for a user
 * @param username - Username to clear attempts for
 */
function clearFailedAttempts(username: string): void {
  delete failedLoginAttempts[username];
}

/**
 * Get user by ID
 * @param id - User ID
 * @returns User data or null if not found
 */
export async function getUserById(id: string | number): Promise<UserData | null> {
  try {
    // Get user with password
    const users = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!users || !Array.isArray(users) || users.length === 0) {
      return null;
    }

    return users[0] as UserData;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Refresh access token using a valid refresh token
 * @param refreshToken - Current refresh token
 * @returns New token pair and CSRF token
 */
export async function refreshTokens(refreshToken: string): Promise<{ tokens: TokenPair, csrfToken: string }> {
  try {
    // This would validate the refresh token and get the payload
    // In a real implementation, you would verify against a token blacklist
    
    // For now, just decode the token (actual verification happens in the middleware)
    const payload = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64').toString());
    
    // Get the user from the database to ensure they still exist and have appropriate permissions
    const user = await getUserById(payload.sub);
    
    if (!user) {
      throw new InvalidCredentialsError('User not found');
    }
    
    // Generate new CSRF token
    const csrfToken = generateCsrfToken();
    
    // Generate new token pair
    const tokens = generateTokenPair(user, csrfToken);
    
    return { tokens, csrfToken };
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new InvalidCredentialsError('Invalid refresh token');
  }
}
