import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    console.log(`[Middleware] Processing request for: ${pathname}`);
    console.log(`[Middleware] User role: ${token?.role}`);

    // If trying to access admin routes (but NOT the login page), check for admin role
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      if (!token || token.role !== 'ADMIN') {
        console.log(`[Middleware] Access denied - user role: ${token?.role}`);
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to login page
        if (pathname === '/admin/login') {
          return true;
        }

        // For admin routes, require authentication
        if (pathname.startsWith('/admin')) {
          return !!token;
        }

        // Allow all other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*'],
}; 