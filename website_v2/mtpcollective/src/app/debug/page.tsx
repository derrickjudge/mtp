'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const setAuthCookie = () => {
    const authToken = localStorage.getItem('sb-denljmcgyghtpcygsocd-auth-token');
    if (authToken) {
      try {
        const tokenData = JSON.parse(authToken);
        // Set the cookie with the same name Supabase expects
        document.cookie = `sb-denljmcgyghtpcygsocd-auth-token=${authToken}; path=/; max-age=3600; SameSite=Lax`;
        // Refresh the debug info
        gatherDebugInfo();
      } catch (error) {
        console.error('Error setting auth cookie:', error);
      }
    }
  };

  const gatherDebugInfo = useCallback(async () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      cookies: document.cookie,
      localStorage: {},
      rawLocalStorage: {},
      session: null,
      user: null,
    };

    // Get localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        info.localStorage[key] = value;
        // Try to parse JSON values
        try {
          info.rawLocalStorage[key] = JSON.parse(value || '');
        } catch {
          info.rawLocalStorage[key] = value;
        }
      }
    }

    // Get session info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    info.session = session;
    info.sessionError = sessionError;

    // Get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    info.user = user;
    info.userError = userError;

    setDebugInfo(info);
  }, [supabase.auth]);

  useEffect(() => {
    gatherDebugInfo();
  }, [gatherDebugInfo]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Information</h1>
        
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Timestamp</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
              {debugInfo.timestamp}
            </pre>
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cookies</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
              {debugInfo.cookies || 'No cookies found'}
            </pre>
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">LocalStorage (Raw)</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
              {JSON.stringify(debugInfo.rawLocalStorage, null, 2)}
            </pre>
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">LocalStorage (String)</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
              {JSON.stringify(debugInfo.localStorage, null, 2)}
            </pre>
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Session</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
              {JSON.stringify(debugInfo.session, null, 2)}
            </pre>
            {debugInfo.sessionError && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
                <p className="font-semibold">Session Error:</p>
                <pre className="mt-2">{JSON.stringify(debugInfo.sessionError, null, 2)}</pre>
              </div>
            )}
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
              {JSON.stringify(debugInfo.user, null, 2)}
            </pre>
            {debugInfo.userError && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
                <p className="font-semibold">User Error:</p>
                <pre className="mt-2">{JSON.stringify(debugInfo.userError, null, 2)}</pre>
              </div>
            )}
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <button
              onClick={setAuthCookie}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
            >
              Set Auth Cookie
            </button>
          </section>
        </div>
      </div>
    </div>
  );
} 