/**
 * Fix Tailwind CSS Processing for Production Builds
 * This script generates a CSS file that includes all Tailwind styles
 * to ensure proper styling in the Vercel production environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Ensuring proper Tailwind CSS processing for production...');

// Make sure the public/css directory exists
const cssDir = path.join(process.cwd(), 'public', 'css');
if (!fs.existsSync(cssDir)) {
  fs.mkdirSync(cssDir, { recursive: true });
  console.log('✅ Created directory: public/css');
}

try {
  // Generate a production-ready CSS file with all Tailwind classes
  execSync('npx tailwindcss -i ./src/app/globals.css -o ./public/css/tailwind.css --minify', {
    stdio: 'inherit'
  });
  console.log('✅ Generated production Tailwind CSS file');
  
  // Create a simple script to inject this CSS file in production
  const injectorScript = `
// This script ensures Tailwind styles are loaded in production
if (typeof window !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/css/tailwind.css';
  document.head.appendChild(link);
}
  `;
  
  fs.writeFileSync(
    path.join(process.cwd(), 'public', 'css', 'inject-tailwind.js'),
    injectorScript.trim()
  );
  console.log('✅ Created CSS injector script');
  
  console.log('🎉 Done! Production CSS fixes have been applied.');
} catch (error) {
  console.error('❌ Error generating production CSS:', error.message);
  process.exit(1);
}
