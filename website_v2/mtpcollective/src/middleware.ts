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
  const res = NextResponse.next();
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          return req.cookies.get(name)?.value;
        },
        set: (name: string, value: string, options: any) => {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove: (name: string, options: any) => {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          res.cookies.set({
            name,
            value: '',
            ...options,
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
    path: req.nextUrl.pathname 
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