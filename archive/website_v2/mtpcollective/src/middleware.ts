import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/api/auth',
  '/api/auth/register',
  '/api/photos',
  '/api/articles',
];

// Paths that require admin role
const ADMIN_PATHS = [
  '/api/users',
  '/api/photos/manage',
  '/api/articles/manage',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and registration
  if (pathname === '/api/auth/register' || (PUBLIC_PATHS.some(path => pathname.startsWith(path)) && request.method === 'GET')) {
    return NextResponse.next();
  }

  // Check for auth token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    // Check admin access
    if (ADMIN_PATHS.some(path => pathname.startsWith(path)) && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Add user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.id);
    requestHeaders.set('x-user-email', decoded.email);
    requestHeaders.set('x-user-role', decoded.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: '/api/:path*',
};
