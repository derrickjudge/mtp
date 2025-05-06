'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// Import our new validation utilities for client-side validation
import { sanitizeInput } from '@/lib/validation';

export default function AdminLogin() {
  // Disable router for now, we'll use form submission for a cleaner approach
  // const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState('');
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const [loginResponse, setLoginResponse] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login attempt for:', username);
      
      // Sanitize input before sending to server
      const sanitizedUsername = sanitizeInput(username);
      const requestBody = { username: sanitizedUsername, password };
      
      console.log('Sending login request to login endpoint...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies to be sent and received
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Login response status:', response.status);
      setLoginResponse(data); // Store the full response for debugging

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Log any cookies that are visible to JavaScript
      console.log('Current document.cookie:', document.cookie);
      
      // Store CSRF token for future requests requiring CSRF protection
      if (data.csrfToken) {
        console.log('CSRF token received, storing for future requests');
        sessionStorage.setItem('csrfToken', data.csrfToken);
      }
      
      // Update success status
      setLoginStatus('Login successful!');
      
      // Store minimal user info for UI purposes only (no sensitive tokens)
      if (data.user) {
        console.log('User info received:', data.user.username, data.user.role);
        sessionStorage.setItem('userRole', data.user.role || 'user');
        sessionStorage.setItem('userName', data.user.username || 'user');
      }
      
      // Log debug info if available
      if (data.debug) {
        console.log('Auth debug info:', data.debug);
      }
      
      // Set redirect flag and start countdown
      setRedirectAttempted(true);
      setRedirectCountdown(3);
      
      // Prepare a form submission to redirect to dashboard
      // This is more reliable than client-side navigation for maintaining cookies
      setTimeout(() => {
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = '/admin/dashboard';
        document.body.appendChild(form);
        form.submit();
      }, 3000);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-logo">
        <h1>MTP Collective</h1>
        <p>Admin Portal</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loginStatus && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          {loginStatus}
        </div>
      )}
      
      {redirectAttempted && (
        <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #64748b', borderRadius: '4px' }}>
          <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981', marginBottom: '1rem' }}>
            ✓ Login Successful!
          </p>
          
          <div style={{ 
            marginBottom: '1rem', 
            padding: '0.75rem',
            backgroundColor: '#0f172a',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <p>Redirecting to dashboard in <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{redirectCountdown}</span> seconds...</p>
          </div>
          
          <form method="GET" action="/admin/dashboard">
            <button 
              type="submit"
              className="btn btn-primary"
              style={{ 
                display: 'block', 
                width: '100%', 
                marginTop: '0.5rem', 
                textAlign: 'center',
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              Go to Dashboard Now
            </button>
          </form>
          
          {/* Debug information */}
          {loginResponse && process.env.NODE_ENV !== 'production' && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#1e293b', borderRadius: '4px', fontSize: '0.8rem' }}>
              <h4>Debug Info (Development Only)</h4>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(loginResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}
