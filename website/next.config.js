/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds
  eslint: {
    // Only run ESLint during development, not during builds
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during builds
  typescript: {
    // Only check types during development, not during builds
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  // Disable optimizations that rely on native bindings
  swcMinify: true,
  transpilePackages: ['lightningcss', '@tailwindcss/oxide', 'yet-another-react-lightbox'],
  // Skip external CSS file loading for now to avoid Oxide issues
  optimizeFonts: false,
  
  // Configure webpack to handle CSS processing properly
  webpack: (config, { isServer }) => {
    // Fix for CSS processing issues in Vercel
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
      
      // Force usage of babel for CSS processing
      const oneOfRule = config.module.rules.find((rule) => typeof rule.oneOf === 'object');
      if (oneOfRule) {
        const cssModuleRules = oneOfRule.oneOf.filter((rule) => 
          rule.test && rule.test.toString().includes('modules'))
        
        for (const rule of cssModuleRules) {
          if (Array.isArray(rule.use)) {
            rule.use.forEach((loader) => {
              if (typeof loader === 'object' && loader.loader && loader.loader.includes('postcss-loader')) {
                if (!loader.options) loader.options = {};
                if (!loader.options.postcssOptions) loader.options.postcssOptions = {};
                
                // Use a simpler PostCSS config for builds
                loader.options.postcssOptions.config = false;
                loader.options.postcssOptions.plugins = [
                  require('postcss-flexbugs-fixes'),
                  require('postcss-preset-env')({ stage: 3 }),
                ];
              }
            });
          }
        }
      }
    }
    
    return config;
  },
  
  // Use simpler experimental features
  experimental: {
    forceSwcTransforms: true,
  },
};

module.exports = nextConfig;
