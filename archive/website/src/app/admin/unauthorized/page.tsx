'use client';

import React from 'react';
import Link from 'next/link';

export default function Unauthorized() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1>Access Denied</h1>
      <p style={{ fontSize: '1.25rem', margin: '1.5rem 0' }}>
        You do not have permission to access this area.
      </p>
      <p>
        Please contact an administrator if you believe this is an error.
      </p>
      <div style={{ marginTop: '2rem' }}>
        <Link href="/">
          <button className="btn btn-primary">Return to Home</button>
        </Link>
      </div>
    </div>
  );
}
