/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Disable image optimization to prevent 403 errors on deployment
    unoptimized: process.env.NODE_ENV === 'production',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'pub-8473897a453e4a39824456dc238f2559.r2.dev',
      },
    ],
  },
  // SECURITY FIX: Removed env section that was exposing secrets to client-side
  // R2 secrets should only be accessible on server-side
};

module.exports = nextConfig; 