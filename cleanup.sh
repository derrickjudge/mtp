#!/bin/bash

# Script to clean up redundant and unused files in the MTP Collective codebase
echo "Starting cleanup of MTP Collective codebase..."

# 1. Clean up duplicate configuration files
echo "Removing duplicate configuration files..."

# Next.js config - keep next.config.cjs (the CommonJS version)
if [ -f "next.config.js" ] && [ -f "next.config.cjs" ]; then
  echo "- Removing duplicate next.config.js (keeping next.config.cjs)"
  rm next.config.js
fi

# PostCSS config - keep the JS version
if [ -f "postcss.config.js" ] && [ -f "postcss.config.mjs" ]; then
  echo "- Removing duplicate postcss.config.mjs (keeping postcss.config.js)"
  rm postcss.config.mjs
fi

# ESLint config - keep only .eslintrc.json
if [ -f ".eslintrc.json" ]; then
  if [ -f "eslint.config.js" ]; then
    echo "- Removing eslint.config.js (keeping .eslintrc.json)"
    rm eslint.config.js
  fi
  
  if [ -f "eslint.config.mjs" ]; then
    echo "- Removing eslint.config.mjs (keeping .eslintrc.json)"
    rm eslint.config.mjs
  fi
fi

# 2. Remove .DS_Store files
echo "Removing .DS_Store files..."
find . -name ".DS_Store" -delete

# 3. Clean up node_modules if needed (commented out by default)
# echo "Removing node_modules (you'll need to run npm install after)..."
# rm -rf node_modules

# 4. Clean up .next build directory
echo "Cleaning up Next.js build cache..."
rm -rf .next

echo "Cleanup complete! Please run npm install and npm run dev to verify everything works." 