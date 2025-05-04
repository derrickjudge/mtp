'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  totalPhotos: number;
  totalCategories: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({ totalPhotos: 0, totalCategories: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authStatus, setAuthStatus] = useState('Checking authentication...');
  
  // Check authentication on load and preserve it
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setAuthStatus('Authentication verified - token found in localStorage');
      
      // For better security, these should be properly handled server-side
      // This is a client-side workaround for development purposes
      if (!document.cookie.includes('auth_token=')) {
        // Add the token to cookies if not already present
        document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Strict`;
        console.log('Added auth token to cookies for persistent sessions');
      }
    } else {
      setAuthStatus('No authentication token found');
      // If no token, redirect to login
      setTimeout(() => {
        router.push('/admin/login');
      }, 2000);
    }
  }, [router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch photos count
        const photosResponse = await fetch('/api/photos?count=true');
        const categoriesResponse = await fetch('/api/categories');

        if (!photosResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const photosData = await photosResponse.json();
        const categoriesData = await categoriesResponse.json();

        setStats({
          totalPhotos: photosData.pagination?.total || 0,
          totalCategories: categoriesData.length || 0,
        });
      } catch (err: any) {
        setError('Error loading dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1>Admin Dashboard</h1>
      
      <div style={{ 
        padding: '1rem', 
        margin: '1rem 0', 
        backgroundColor: '#475569', 
        borderRadius: '4px',
        border: '1px solid #64748b'
      }}>
        <h2>Authentication Status</h2>
        <p>{authStatus}</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading dashboard stats...</p>
      ) : (
        <div className="admin-dashboard-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          {/* Photos Card */}
          <div className="admin-card">
            <div className="admin-card-title">
              <h2>Photos</h2>
              <span>{stats.totalPhotos}</span>
            </div>
            <p>Manage your photography portfolio</p>
            <Link href="/admin/photos">
              <button className="btn btn-primary">Manage Photos</button>
            </Link>
          </div>

          {/* Categories Card */}
          <div className="admin-card">
            <div className="admin-card-title">
              <h2>Categories</h2>
              <span>{stats.totalCategories}</span>
            </div>
            <p>Organize photos into categories</p>
            <Link href="/admin/categories">
              <button className="btn btn-primary">Manage Categories</button>
            </Link>
          </div>

          {/* Upload Card */}
          <div className="admin-card">
            <div className="admin-card-title">
              <h2>Upload</h2>
            </div>
            <p>Add new photos to your portfolio</p>
            <Link href="/admin/photos/upload">
              <button className="btn btn-primary">Upload Photos</button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
