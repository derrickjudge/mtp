'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This is a redirect page from /blog to /articles

export default function BlogRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Get current URL search params to preserve filters
    const currentUrl = new URL(window.location.href);
    const searchParams = currentUrl.search;
    
    // Redirect to the same path but under /articles instead of /blog
    router.replace(`/articles${searchParams}`);
  }, [router]);
  
  // Render a loading message while redirecting
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Redirecting...</h1>
      <p>Please wait while we redirect you to our articles section.</p>
    </div>
  );
}
