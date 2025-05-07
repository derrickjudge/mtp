'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// This is a redirect page from /blog/[slug] to /articles/[slug]

export default function BlogArticleRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  useEffect(() => {
    if (slug) {
      // Redirect to the same article slug but under /articles instead of /blog
      router.replace(`/articles/${slug}`);
    } else {
      // If there's no slug for some reason, redirect to the articles index
      router.replace('/articles');
    }
  }, [slug, router]);
  
  // Render a loading message while redirecting
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Redirecting...</h1>
      <p>Please wait while we redirect you to our articles section.</p>
    </div>
  );
}
