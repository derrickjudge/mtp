'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
}

// Create a client for admin operations
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if we have a valid session on mount
    const checkSession = async () => {
      try {
        console.log('Checking initial session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session check error:', sessionError);
          return;
        }

        console.log('Session exists:', !!session);
        
        if (session) {
          console.log('User ID:', session.user.id);
          // Check if user is admin
          const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { user_id: session.user.id });
          
          console.log('Admin check result:', { isAdmin, adminError });
          
          if (adminError) {
            console.error('Admin check error:', adminError);
            await supabase.auth.signOut();
            return;
          }

          if (isAdmin) {
            console.log('User is admin, redirecting to photos page...');
            router.push('/admin/photos');
          } else {
            console.log('User is not admin, signing out...');
            await supabase.auth.signOut();
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        setIsInitialized(true);
      }
    };

    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting login with email:', email);
      
      // First, sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Auth response:', { 
        hasData: !!authData, 
        hasSession: !!authData?.session,
        error: authError 
      });

      if (authError) {
        console.error('Auth error:', {
          message: authError.message,
          status: authError.status,
          name: authError.name
        });
        throw new Error('Invalid email or password');
      }

      if (!authData.session) {
        console.error('No session in auth response');
        throw new Error('Authentication failed');
      }

      console.log('Session established, user ID:', authData.session.user.id);

      // Wait a moment to ensure the session is fully established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the current session to verify it's active
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Session verification:', {
        hasSession: !!session,
        error: sessionError
      });
      
      if (sessionError) {
        console.error('Session verification error:', sessionError);
        throw new Error('Authentication failed');
      }
      if (!session) {
        console.error('No session after verification');
        throw new Error('Authentication failed');
      }

      console.log('Checking admin role for user:', session.user.id);

      // Check if the user has admin role using the is_admin function
      const { data: isAdmin, error: roleError } = await supabase
        .rpc('is_admin', { user_id: session.user.id });

      console.log('Role check response:', { 
        isAdmin, 
        roleError,
        errorDetails: roleError ? {
          code: roleError.code,
          message: roleError.message,
          details: roleError.details,
          hint: roleError.hint
        } : null
      });

      if (roleError) {
        console.error('Error checking admin role:', {
          error: roleError,
          code: roleError.code,
          message: roleError.message,
          details: roleError.details,
          hint: roleError.hint
        });
        await supabase.auth.signOut();
        throw new Error('Invalid email or password');
      }

      if (!isAdmin) {
        console.log('User is not an admin, signing out...');
        await supabase.auth.signOut();
        throw new Error('Invalid email or password');
      }

      console.log('Login successful, redirecting to photos page...');
      router.push('/admin/photos');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </span>
              ) : null}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 