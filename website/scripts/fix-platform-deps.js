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

try {
  if (isCI) {
    console.log('📦 Running in CI environment, ensuring Linux binaries are available');
    
    // Force install lightningcss to ensure we have the right binary
    try {
      execSync('npm install lightningcss --no-save', { stdio: 'inherit' });
      console.log('✅ Successfully installed lightningcss');
    } catch (error) {
      console.warn('⚠️ Could not install lightningcss:', error.message);
    }
    
    // Make sure the node_modules structure is correct
    const moduleDir = path.join(process.cwd(), 'node_modules', 'lightningcss');
    if (fs.existsSync(moduleDir)) {
      console.log('✅ lightningcss module exists');
    } else {
      console.warn('⚠️ lightningcss module not found');
    }
  } else {
    console.log('💻 Running in development environment, skipping platform fixes');
  }
  
  console.log('✅ Platform dependency check completed');
} catch (error) {
  console.error('❌ Error fixing platform dependencies:', error);
  // Don't exit with error to allow the build to continue
}
