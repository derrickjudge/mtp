/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lightningcss'],
  // Configure webpack to handle CSS processing properly
  webpack: (config, { isServer }) => {
    // Fix for CSS processing issues in Vercel
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        // Add other polyfills if needed
      };
    }
    
    return config;
  },
  // Increase memory limit for build process
  experimental: {
    optimizeCss: true,
    forceSwcTransforms: true,
  },
};

module.exports = nextConfig;
