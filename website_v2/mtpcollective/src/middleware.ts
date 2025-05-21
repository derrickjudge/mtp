import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(req: NextRequest) {
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

  // If there's no session and the user is trying to access an admin route
  if (!session && req.nextUrl.pathname.startsWith('/admin')) {
    // Redirect to login page if not already there
    if (req.nextUrl.pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // If there's a session, check if user is admin for admin routes
  if (session && req.nextUrl.pathname.startsWith('/admin')) {
    // Skip admin check for login page
    if (req.nextUrl.pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin/photos', req.url));
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { 
      user_id: session.user.id 
    });

    if (adminError || !isAdmin) {
      // If not admin, redirect to login
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
}; 