import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Debug logging function
const debug = (message: string, data?: any) => {
  console.log(`[Middleware Debug] ${message}`, data || '');
};

export async function middleware(req: NextRequest) {
  debug('Processing request for path:', req.nextUrl.pathname);
  
  // Create a response that we can modify
  const res = NextResponse.next();
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          debug('Getting cookie:', name);
          const cookie = req.cookies.get(name);
          debug('Cookie value:', cookie?.value);
          return cookie?.value;
        },
        set: (name: string, value: string, options: any) => {
          debug('Setting cookie:', { name, value, options });
          // Set cookie on the request
          req.cookies.set({
            name,
            value,
            ...options,
          });
          // Set cookie on the response
          res.cookies.set({
            name,
            value,
            ...options,
            // Ensure cookies are accessible to JavaScript
            httpOnly: false,
            // Ensure cookies are sent with every request
            path: '/',
            // Ensure cookies are sent over HTTPS in production
            secure: process.env.NODE_ENV === 'production',
            // Allow cookies to be sent in cross-site requests
            sameSite: 'lax',
          });
        },
        remove: (name: string, options: any) => {
          debug('Removing cookie:', name);
          // Remove cookie from request
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          // Remove cookie from response
          res.cookies.set({
            name,
            value: '',
            ...options,
            // Ensure cookies are accessible to JavaScript
            httpOnly: false,
            // Ensure cookies are sent with every request
            path: '/',
            // Ensure cookies are sent over HTTPS in production
            secure: process.env.NODE_ENV === 'production',
            // Allow cookies to be sent in cross-site requests
            sameSite: 'lax',
            // Set expiration to past date to remove cookie
            expires: new Date(0),
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  debug('Session check:', { 
    hasSession: !!session,
    userId: session?.user?.id,
    path: req.nextUrl.pathname,
    cookies: req.cookies.getAll().map(c => c.name)
  });

  // If there's no session and the user is trying to access an admin route
  if (!session && req.nextUrl.pathname.startsWith('/admin')) {
    debug('No session, redirecting to login');
    // Redirect to login page if not already there
    if (req.nextUrl.pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // If there's a session, check if user is admin for admin routes
  if (session && req.nextUrl.pathname.startsWith('/admin')) {
    // Skip admin check for login page
    if (req.nextUrl.pathname === '/admin/login') {
      debug('On login page with session, redirecting to photos');
      return NextResponse.redirect(new URL('/admin/photos', req.url));
    }

    debug('Checking admin role for user:', session.user.id);
    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { 
      user_id: session.user.id 
    });

    debug('Admin check result:', { isAdmin, adminError });

    if (adminError || !isAdmin) {
      debug('Not admin or error checking admin status, redirecting to login');
      // If not admin, redirect to login
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    debug('Admin check passed, allowing access');
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
}; 