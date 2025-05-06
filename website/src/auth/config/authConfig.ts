/**
 * Authentication Configuration
 * Centralized configuration for all authentication-related settings
 */

/**
 * Validates that an environment variable is defined
 * @param name - The name of the environment variable
 * @param defaultValue - Optional default value if not set
 * @returns The value of the environment variable
 */
function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value && defaultValue === undefined) {
    // Only log in development, don't expose in production
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Warning: Environment variable ${name} is not set`);
    }
  }
  return value || '';
}

/**
 * Auth configuration object
 */
export const authConfig = {
  // JWT configuration
  jwt: {
    accessSecret: getEnvVar('JWT_SECRET', 'mtp_collective_access_key_change_me_in_production'),
    refreshSecret: getEnvVar('JWT_REFRESH_SECRET', 'mtp_collective_refresh_key_change_me_in_production'),
    accessExpiresIn: getEnvVar('JWT_ACCESS_EXPIRES_IN', '4h'),
    refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),
    issuer: getEnvVar('JWT_ISSUER', 'mtp-collective'),
    audience: getEnvVar('JWT_AUDIENCE', 'mtp-website'),
  },
  
  // CSRF protection
  csrf: {
    secret: getEnvVar('CSRF_SECRET', 'mtp_collective_csrf_key_change_me_in_production'),
    tokenLength: 32,
  },
  
  // Cookie settings
  cookies: {
    access: {
      name: 'auth_token',
      maxAge: 60 * 60 * 4, // 4 hours in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    },
    refresh: {
      name: 'refresh_token',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    },
    csrf: {
      name: 'csrf_token',
      maxAge: 60 * 60 * 4, // 4 hours in seconds
      httpOnly: false, // Must be accessible to JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    },
  },
  
  // Rate limiting settings
  rateLimit: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 requests per windowMs
      message: 'Too many login attempts, please try again later',
      statusCode: 429,
    },
    refreshToken: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 requests per windowMs
      message: 'Too many token refresh attempts, please try again later',
      statusCode: 429,
    },
    accountLockout: {
      maxAttempts: 5, // Lock after 5 failed attempts
      lockDuration: 30 * 60 * 1000, // 30 minutes
    },
  },
  
  // Protected routes configuration
  routes: {
    // Routes that require authentication
    protected: [
      '/admin/dashboard',
      '/admin/photos',
      '/admin/categories',
      '/admin/settings',
      '/admin/users',
    ],
    // Routes that require admin role
    adminOnly: [
      '/admin/settings',
      '/admin/users',
    ],
    // API endpoints that require authentication
    protectedApi: [
      '/api/photos',
      '/api/categories',
      '/api/settings',
      '/api/users',
    ],
    // API endpoints that require CSRF validation
    csrfProtected: [
      '/api/photos',
      '/api/categories',
      '/api/settings',
      '/api/users',
    ],
    // Routes exempted from authentication (even if they match protected patterns)
    public: [
      '/admin/login',
      '/api/auth/login',
      '/api/auth/simple-login',
      '/api/auth/refresh',
    ],
  },
};
