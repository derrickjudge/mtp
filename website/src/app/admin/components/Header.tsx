'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminHeader() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname?.startsWith(path) ? 'active' : '';
  };

  return (
    <header className="admin-header">
      <div className="admin-header-content">
        <h2>MTP Collective Admin</h2>
        
        <nav className="admin-top-nav">
          <ul>
            <li className={isActive('/admin/dashboard')}>
              <Link href="/admin/dashboard">Dashboard</Link>
            </li>
            <li className={isActive('/admin/photos')}>
              <Link href="/admin/photos">Photos</Link>
            </li>
            <li className={isActive('/admin/categories')}>
              <Link href="/admin/categories">Categories</Link>
            </li>
            <li className={isActive('/admin/users')}>
              <Link href="/admin/users">Users</Link>
            </li>
            <li className={isActive('/admin/settings')}>
              <Link href="/admin/settings">Settings</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
