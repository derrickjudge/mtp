import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If there's no session and the user is trying to access an admin route
  if (!session && req.nextUrl.pathname.startsWith('/admin')) {
    // Redirect to login page if not already there
    if (req.nextUrl.pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // If there's a session and the user is on the login page
  if (session && req.nextUrl.pathname === '/admin/login') {
    // Redirect to admin photos page
    return NextResponse.redirect(new URL('/admin/photos', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
}; 