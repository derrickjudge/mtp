'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState('');
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store the token in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Login successful, token stored in localStorage');
      
      // Update success status
      setLoginStatus('Login successful!');
      
      // Store the token in localStorage and sessionStorage for redundancy
      sessionStorage.setItem('authToken', data.token);
      sessionStorage.setItem('redirectTime', Date.now().toString());
      
      // Set redirect flag and start countdown
      setRedirectAttempted(true);
      setRedirectCountdown(3);
      
      // Start countdown and automatic redirect
      let countdown = 3;
      const timer = setInterval(() => {
        countdown -= 1;
        setRedirectCountdown(countdown);
        
        if (countdown <= 0) {
          clearInterval(timer);
          // Use window.location for a hard navigation
          window.location.href = '/admin/dashboard';
        }
      }, 1000);
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
          
          <a 
            href='/admin/dashboard'
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
          </a>
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
