'use client';

/**
 * Admin Layout
 * Provides a consistent layout for all admin pages
 */

import React from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Logout from './components/Logout';
import './admin.css';

// Metadata is configured in a separate file to avoid conflicts with client components

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Client-side authentication check using localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user has auth token in localStorage
    const authToken = localStorage.getItem('auth_token');
    setIsAuthenticated(!!authToken);
  }, []);
  
  return (
    <div className="admin-layout">
      {isAuthenticated ? (
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <h1>MTP Collective</h1>
            <p>Admin Panel</p>
          </div>
          
          <nav className="admin-nav">
            <ul>
              <li>
                <Link href="/admin/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link href="/admin/photos">Photos</Link>
              </li>
              <li>
                <Link href="/admin/categories">Categories</Link>
              </li>
              <li className="logout-button">
                <Logout />
              </li>
            </ul>
          </nav>
        </aside>
      ) : null}
      
      <main className={`admin-content ${!isAuthenticated ? 'full-width' : ''}`}>
        {children}
      </main>
    </div>
  );
}
