'use client';

import { useEffect } from 'react';

export default function DisableContextMenu() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Skip on admin pages
      if (window.location.pathname.startsWith('/admin')) return;
      // Block only for images
      if (target.tagName === 'IMG' || target.closest('img')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  return null;
}


