"use client";

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthPage() {
  const { user, loading, error, signIn, signUp } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email || !password) {
      setFormError('Email and password are required.');
      return;
    }
    if (tab === 'signin') {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="flex mb-6" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'signin'}
            className={`flex-1 py-2 rounded-l-lg ${tab === 'signin' ? 'bg-black text-white' : 'bg-gray-800 text-gray-400'}`}
            onClick={() => setTab('signin')}
            disabled={tab === 'signin'}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={tab === 'signup'}
            className={`flex-1 py-2 rounded-r-lg ${tab === 'signup' ? 'bg-black text-white' : 'bg-gray-800 text-gray-400'}`}
            onClick={() => setTab('signup')}
            disabled={tab === 'signup'}
          >
            Sign Up
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" role="form">
          <div>
            <label htmlFor="email" className="block text-gray-300 mb-1">Email</label>
            <input
              id="email"
              type="email"
              className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-300 mb-1">Password</label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              required
            />
          </div>
          {(formError || error) && (
            <div className="text-red-400 text-sm">{formError || error}</div>
          )}
          <button
            type="submit"
            className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (tab === 'signin' ? 'Signing In...' : 'Signing Up...') : (tab === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
} 