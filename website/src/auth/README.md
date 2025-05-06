# MTP Collective Authentication System

This directory contains the authentication system for the MTP Collective website. 
It provides a secure, modular, and maintainable approach to handling user authentication.

## Architecture Overview

The authentication system follows a domain-driven design approach with clear separation of concerns:

```
/auth
  /config     - Configuration settings for auth system
  /errors     - Custom error classes 
  /middleware - Route protection and security checks
  /services   - Business logic for authentication
  /utils      - Helper functions (tokens, cookies)
  types.ts    - Shared types and interfaces
```

## Key Features

- **Secure HTTP-only Cookies**: All authentication tokens are stored in HTTP-only cookies to prevent XSS attacks
- **CSRF Protection**: Double-submit cookie pattern to prevent cross-site request forgery
- **Rate Limiting**: Protection against brute force attacks
- **Role-Based Access Control**: Different permissions for different user roles
- **JWT Token Management**: Access and refresh tokens with proper rotation
- **Edge Runtime Compatible**: Works in both server and middleware environments

## How It Works

### Authentication Flow

1. **Login**:
   - User submits credentials
   - Server verifies credentials 
   - Server generates access token, refresh token, and CSRF token
   - Tokens are set as HTTP-only cookies
   - CSRF token is returned to the client

2. **Protected Route Access**:
   - Middleware checks for auth_token cookie
   - If valid, adds user information to request headers
   - If invalid, redirects to login

3. **State-Changing Operations**:
   - Client includes CSRF token in request header
   - Server validates CSRF token against cookie
   - If valid, processes the request
   - If invalid, returns 403 Forbidden

4. **Token Refresh**:
   - Client calls refresh endpoint when access token expires
   - Server validates refresh token and issues new tokens
   - Old tokens are invalidated

## Security Considerations

- **JWT Secret Keys**: Different keys for access and refresh tokens
- **Token Expiration**: Short-lived access tokens (4 hours), longer refresh tokens (7 days)
- **Account Lockout**: Automatic lockout after multiple failed login attempts
- **Enhanced Logging**: Detailed logging in development, minimized in production
- **Error Handling**: Custom error classes with appropriate status codes

## Usage Examples

### Protecting a Route

```typescript
// In middleware.ts
import { isAuthenticated, isAdminPath } from './auth/middleware/authMiddleware';

// Check if user is authenticated
const user = isAuthenticated(request);
if (!user) {
  return NextResponse.redirect(new URL('/admin/login', request.url));
}

// Check if admin-only path
if (isAdminPath(pathname) && user.role !== 'admin') {
  return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
}
```

### Creating a Protected API Endpoint

```typescript
// In your API route
import { verifyAccessToken } from '@/auth/utils/tokens';

export async function POST(request: NextRequest) {
  // Get token from cookie
  const accessToken = request.cookies.get('auth_token')?.value;
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Verify token
    const payload = verifyAccessToken(accessToken);
    // Process request with user data from payload
    // ...
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

## Extending the System

To add new authentication features:

1. Define any new types in `types.ts`
2. Add new configuration options in `config/authConfig.ts` 
3. Implement business logic in the appropriate service
4. Update middleware as needed
5. Add tests for the new functionality

## Testing

Authentication system is covered by both unit and integration tests:

- **Unit Tests**: Test individual functions in isolation
- **Integration Tests**: Test authentication flow end-to-end
- **API Tests**: Test the authentication API endpoints

Run tests with:

```bash
npm test -- --testPathPattern=__tests__/auth
```
