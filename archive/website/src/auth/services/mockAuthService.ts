/**
 * Mock Authentication Service
 * Provides authentication functionality without database dependencies
 * For development and testing purposes only
 */
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
  InvalidCredentialsError, 
  AccountLockedError 
} from '../errors/AuthError';

// Mock failed login tracking (in-memory for development)
const failedLoginAttempts: Record<string, { count: number, timestamp: number }> = {};
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Mock user database
const MOCK_USERS = [
  {
    id: 1,
    username: 'admin',
    password: 'password123', // In a real app, this would be hashed
    role: 'admin',
    email: 'admin@example.com'
  },
  {
    id: 2,
    username: 'user',
    password: 'userpass',
    role: 'user',
    email: 'user@example.com'
  }
];

/**
 * Authenticate a user with username/email and password
 * @param credentials - Login credentials (username/password)
 * @returns Authentication result with tokens and user data
 * @throws {InvalidCredentialsError} If credentials are invalid
 * @throws {AccountLockedError} If account is locked due to too many failed attempts
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<AuthResult> {
  const { username, password } = credentials;
  console.log(`[MOCK-AUTH] Authentication attempt for user: ${username}`);

  try {
    // Check for account lockout
    checkAccountLockout(username);

    // Find user in mock database
    const user = MOCK_USERS.find(u => 
      u.username === username || u.email === username
    );

    // User not found
    if (!user) {
      console.log(`[MOCK-AUTH] User not found: ${username}`);
      recordFailedAttempt(username);
      throw new InvalidCredentialsError();
    }

    // Verify password (in a real app, would use bcrypt.compare)
    if (user.password !== password) {
      console.log(`[MOCK-AUTH] Invalid password for user: ${username}`);
      recordFailedAttempt(username);
      throw new InvalidCredentialsError();
    }

    // Password is valid - clear failed attempts
    console.log(`[MOCK-AUTH] Authentication successful for user: ${username}`);
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
    console.error('[MOCK-AUTH] Authentication error:', error);
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
  const now = Date.now();

  // If account is locked and lockout period hasn't expired
  if (count >= LOCKOUT_ATTEMPTS && now - timestamp < LOCKOUT_DURATION_MS) {
    // Calculate remaining lockout time
    const remainingMs = LOCKOUT_DURATION_MS - (now - timestamp);
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    
    throw new AccountLockedError(
      `Account locked due to too many failed attempts. Please try again in ${remainingMinutes} minutes.`,
      remainingMs
    );
  }

  // If lockout period has expired, reset the attempts
  if (now - timestamp >= LOCKOUT_DURATION_MS) {
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
  
  console.log(`[MOCK-AUTH] Failed attempt for ${username}: ${failedLoginAttempts[username].count}/${LOCKOUT_ATTEMPTS}`);
}

/**
 * Clear failed login attempts for a user
 * @param username - Username to clear attempts for
 */
function clearFailedAttempts(username: string): void {
  delete failedLoginAttempts[username];
  console.log(`[MOCK-AUTH] Cleared failed attempts for ${username}`);
}

/**
 * Mock refresh tokens implementation
 * @param refreshToken - Current refresh token 
 * @returns New token pair and CSRF token
 */
export async function refreshTokens(refreshToken: string): Promise<{ tokens: TokenPair, csrfToken: string }> {
  try {
    // For mocking purposes, we'll just decode the refresh token and pretend it's valid
    // In a real implementation, you would verify against a token blacklist
    const parts = refreshToken.split('.');
    if (parts.length !== 3) {
      throw new InvalidCredentialsError('Invalid refresh token format');
    }
    
    // Decode payload (base64 to JSON)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    );
    
    // Create user object from payload
    const user: UserData = {
      id: payload.sub,
      username: payload.username,
      role: payload.role
    };
    
    // Generate new CSRF token
    const csrfToken = generateCsrfToken();
    
    // Generate new token pair
    const tokens = generateTokenPair(user, csrfToken);
    
    return { tokens, csrfToken };
  } catch (error) {
    console.error('[MOCK-AUTH] Token refresh error:', error);
    throw new InvalidCredentialsError('Invalid refresh token');
  }
}
