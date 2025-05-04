'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function Logout() {
  const router = useRouter();
  
  const handleLogout = () => {
    // Clear authentication data from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    // Clear authentication cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    
    // Redirect to login page
    router.push('/admin/login');
  };
  
  return (
    <button 
      onClick={handleLogout}
      style={{
        background: 'none',
        border: 'none',
        color: 'inherit',
        cursor: 'pointer',
        fontSize: 'inherit',
        padding: '0',
        textAlign: 'left',
        width: '100%',
      }}
    >
      Logout
    </button>
  );
}
