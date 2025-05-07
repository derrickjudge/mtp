// This script ensures Tailwind styles are loaded in production
if (typeof window !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/css/tailwind.css';
  document.head.appendChild(link);
}