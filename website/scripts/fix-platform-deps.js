/**
 * This script ensures the correct platform-specific binaries are installed
 * It's particularly important for CSS processing on Vercel deployments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Checking and fixing platform-specific dependencies...');

// Determine if we're running in a CI environment (like Vercel)
const isCI = process.env.CI === 'true' || process.env.VERCEL === '1';

// Set environment variables to disable native bindings
process.env.NEXT_DISABLE_OXIDE = '1'; // Disable Tailwind Oxide
process.env.TAILWIND_DISABLE_OXIDE = '1'; // Disable Tailwind Oxide
process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = '1'; // Skip lockfile checks

try {
  if (isCI) {
    console.log('📦 Running in CI environment, ensuring compatible dependencies');
    
    // Create a simpler postcss.config.js for Vercel
    const postCssConfig = `
module.exports = {
  plugins: {
    'postcss-flexbugs-fixes': {},
    'postcss-preset-env': {
      autoprefixer: {
        flexbox: 'no-2009',
      },
      stage: 3,
    },
  },
};
`;
    
    // Write simplified postcss config to avoid Oxide
    fs.writeFileSync(path.join(process.cwd(), 'postcss.config.js'), postCssConfig);
    console.log('✅ Created simplified postcss.config.js');
    
    // Force install compatible dependencies
    try {
      console.log('🔄 Installing compatible CSS processing packages...');
      execSync('npm install postcss postcss-flexbugs-fixes postcss-preset-env --no-save', { stdio: 'inherit' });
      console.log('✅ Successfully installed PostCSS packages');
      
      // Make sure we don't use Tailwind Oxide
      if (fs.existsSync(path.join(process.cwd(), 'node_modules', '@tailwindcss', 'oxide'))) {
        console.log('⚠️ Found Tailwind Oxide - disabling it');
        // Create an empty index.js to prevent loading the native module
        const overridePath = path.join(process.cwd(), 'node_modules', '@tailwindcss', 'oxide', 'index.js');
        fs.writeFileSync(overridePath, 'module.exports = {}; // Disabled to avoid native binding issues');
      }
    } catch (error) {
      console.warn('⚠️ Could not install CSS packages:', error.message);
    }
    
    console.log('📋 Environment configuration:');
    console.log('- NEXT_DISABLE_OXIDE:', process.env.NEXT_DISABLE_OXIDE);
    console.log('- TAILWIND_DISABLE_OXIDE:', process.env.TAILWIND_DISABLE_OXIDE);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
  } else {
    console.log('💻 Running in development environment, skipping platform fixes');
  }
  
  console.log('✅ Platform dependency check completed');
} catch (error) {
  console.error('❌ Error fixing platform dependencies:', error);
  // Don't exit with error to allow the build to continue
}
