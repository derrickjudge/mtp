/** @type {import('next').NextConfig} */
const path = require('path');

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
  // Use standard minification
  transpilePackages: ['lightningcss', '@tailwindcss/oxide', 'yet-another-react-lightbox'],
  // Configure image domains
  images: {
    domains: ['picsum.photos', 'source.unsplash.com', 'images.unsplash.com'],
  },
  
  // Configure webpack to handle CSS processing properly
  webpack: (config, { isServer, dev }) => {
    // Enhanced CSS processing for production
    if (!isServer) {
      // Find the CSS rule
      const cssRule = config.module.rules.find(
        rule => rule.test?.toString().includes('css')
      );
      
      if (cssRule && cssRule.use) {
        // Make sure PostCSS loader is properly configured
        const postCssLoaderIndex = cssRule.use.findIndex(
          loader => typeof loader === 'object' && loader.loader === 'postcss-loader'
        );
        
        if (postCssLoaderIndex === -1) {
          cssRule.use.push({
            loader: 'postcss-loader',
            options: {
              sourceMap: dev,
              postcssOptions: {
                config: path.resolve('./postcss.config.js'),
              },
            },
          });
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

      // Additional fallbacks for Vercel
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    return config;
  },
  
  // Use simpler experimental features
  experimental: {
    forceSwcTransforms: true,
  },
};

module.exports = nextConfig;
