'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging function
const debug = (message: string, data?: any) => {
  console.log(`[DEBUG] ${message}`, data || '');
  // Also show in UI for development
  if (process.env.NODE_ENV === 'development') {
    const debugElement = document.getElementById('debug-output');
    if (debugElement) {
      debugElement.innerHTML += `<div class="text-gray-300">${message} ${data ? JSON.stringify(data) : ''}</div>`;
    }
  }
};

debug('Initializing login page');
debug('Supabase URL:', supabaseUrl);
debug('Supabase Anon Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
}

// Create a client for admin operations
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'sb-denljmcgyghtpcygsocd-auth-token',
    storage: {
      getItem: (key) => {
        debug('Getting storage item:', key);
        if (typeof window === 'undefined') {
          return null;
        }
        const value = localStorage.getItem(key);
        debug('Storage value:', value);
        return value;
      },
      setItem: (key, value) => {
        debug('Setting storage item:', { key, value });
        if (typeof window === 'undefined') {
          return;
        }
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        debug('Removing storage item:', key);
        if (typeof window === 'undefined') {
          return;
        }
        localStorage.removeItem(key);
      },
    },
  },
});

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  const addDebugMessage = (message: string, data?: any) => {
    const fullMessage = `${message} ${data ? JSON.stringify(data) : ''}`;
    debug(message, data);
    setDebugMessages(prev => [...prev, fullMessage]);
  };

  useEffect(() => {
    // Check if we have a valid session on mount
    const checkSession = async () => {
      try {
        addDebugMessage('Checking initial session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          addDebugMessage('Session check error:', sessionError);
          return;
        }

        addDebugMessage('Session exists:', !!session);
        
        if (session) {
          addDebugMessage('User ID:', session.user.id);
          // Check if user is admin
          const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { user_id: session.user.id });
          
          addDebugMessage('Admin check result:', { isAdmin, adminError });
          
          if (adminError) {
            addDebugMessage('Admin check error:', adminError);
            await supabase.auth.signOut();
            return;
          }

          if (isAdmin) {
            addDebugMessage('User is admin, redirecting to photos page...');
            router.push('/admin/photos');
          } else {
            addDebugMessage('User is not admin, signing out...');
            await supabase.auth.signOut();
          }
        }
      } catch (err) {
        addDebugMessage('Error checking session:', err);
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
    setDebugMessages([]); // Clear previous debug messages

    try {
      addDebugMessage('Attempting login with email:', email);
      
      // First, sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      addDebugMessage('Auth response:', { 
        hasData: !!authData, 
        hasSession: !!authData?.session,
        error: authError 
      });

      if (authError) {
        addDebugMessage('Auth error:', {
          message: authError.message,
          status: authError.status,
          name: authError.name
        });
        throw new Error('Invalid email or password');
      }

      if (!authData.session) {
        addDebugMessage('No session in auth response');
        throw new Error('Authentication failed');
      }

      addDebugMessage('Session established, user ID:', authData.session.user.id);

      // Set the auth cookie with the session data
      const authToken = JSON.stringify(authData.session);
      document.cookie = `sb-denljmcgyghtpcygsocd-auth-token=${authToken}; path=/; max-age=3600; SameSite=Lax`;
      addDebugMessage('Auth cookie set');

      // Wait a moment to ensure the session is fully established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the current session to verify it's active
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      addDebugMessage('Session verification:', {
        hasSession: !!session,
        error: sessionError
      });
      
      if (sessionError) {
        addDebugMessage('Session verification error:', sessionError);
        throw new Error('Authentication failed');
      }
      if (!session) {
        addDebugMessage('No session after verification');
        throw new Error('Authentication failed');
      }

      addDebugMessage('Checking admin role for user:', session.user.id);

      // Check if the user has admin role using the is_admin function
      const { data: isAdmin, error: roleError } = await supabase
        .rpc('is_admin', { user_id: session.user.id });

      addDebugMessage('Role check response:', { 
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
        addDebugMessage('Error checking admin role:', {
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
        addDebugMessage('User is not an admin, signing out...');
        await supabase.auth.signOut();
        throw new Error('Invalid email or password');
      }

      addDebugMessage('Login successful, redirecting to photos page...');
      // Add a small delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        router.replace('/admin/photos');
      } catch (err) {
        addDebugMessage('Router redirect failed, using window.location:', err);
        window.location.href = '/admin/photos';
      }
    } catch (err) {
      addDebugMessage('Login error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Admin Login
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative" role="alert">
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                </span>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-blue-500 group-hover:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">Debug Logs</h3>
            <div id="debug-output" className="text-sm text-gray-300 space-y-1 max-h-96 overflow-y-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
} 