/**
 * Comprehensive fix for Next.js 15 route handlers
 * Ensures all API routes have correct parameter ordering and types
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Scanning for API route handlers...');

// Get all route.ts files in the API directory
const routeFiles = execSync('find /Users/djudge/repos/mtp/website/src/app/api -name "route.ts"', { encoding: 'utf8' })
  .trim()
  .split('\n');

console.log(`Found ${routeFiles.length} route handlers to check`);

// Process each file to ensure handlers have correct signatures
let updatedCount = 0;
let errorCount = 0;

routeFiles.forEach(filePath => {
  try {
    console.log(`Checking ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    let wasUpdated = false;

    // Check if this is a dynamic route (contains [param])
    const isDynamicRoute = filePath.includes('/[') && filePath.includes(']/');
    
    // Extract the dynamic parameter name if present
    let paramName = null;
    if (isDynamicRoute) {
      const match = filePath.match(/\[([^\]]+)\]/);
      if (match && match[1]) {
        paramName = match[1];
        console.log(`  Found dynamic parameter: ${paramName}`);
      }
    }

    // Fix GET handlers
    if (content.includes('export async function GET')) {
      // Fix incorrectly ordered parameters ({ params }, req) -> (req, { params })
      const badOrderPattern = /export\s+async\s+function\s+GET\s*\(\s*{\s*params\s*}[^)]*,\s*req\s*:\s*NextRequest/;
      if (badOrderPattern.test(content)) {
        console.log('  ⚠️ Found incorrectly ordered GET parameters');
        content = content.replace(
          badOrderPattern,
          `export async function GET(req: NextRequest, { params }: { params: { ${paramName || 'id'}: string } }`
        );
        wasUpdated = true;
      }
      
      // Fix other incorrect parameter patterns
      const oldContextPattern = /export\s+async\s+function\s+GET\s*\(\s*req\s*:\s*NextRequest\s*,\s*context\s*:[^)]*\)/;
      if (oldContextPattern.test(content)) {
        console.log('  ⚠️ Found old context parameter pattern in GET');
        content = content.replace(
          oldContextPattern,
          `export async function GET(req: NextRequest, { params }: { params: { ${paramName || 'id'}: string } })`
        );
        wasUpdated = true;
      }
      
      // Replace context.params with params
      if (content.includes('context.params')) {
        console.log('  ⚠️ Found context.params references');
        content = content.replace(/context\.params\./g, 'params.');
        wasUpdated = true;
      }
    }
    
    // Fix PUT handlers
    if (content.includes('export async function PUT')) {
      const badOrderPattern = /export\s+async\s+function\s+PUT\s*\(\s*{\s*params\s*}[^)]*,\s*req\s*:\s*NextRequest/;
      if (badOrderPattern.test(content)) {
        console.log('  ⚠️ Found incorrectly ordered PUT parameters');
        content = content.replace(
          badOrderPattern,
          `export async function PUT(req: NextRequest, { params }: { params: { ${paramName || 'id'}: string } }`
        );
        wasUpdated = true;
      }
      
      const oldContextPattern = /export\s+async\s+function\s+PUT\s*\(\s*req\s*:\s*NextRequest\s*,\s*context\s*:[^)]*\)/;
      if (oldContextPattern.test(content)) {
        console.log('  ⚠️ Found old context parameter pattern in PUT');
        content = content.replace(
          oldContextPattern,
          `export async function PUT(req: NextRequest, { params }: { params: { ${paramName || 'id'}: string } })`
        );
        wasUpdated = true;
      }
    }
    
    // Fix DELETE handlers
    if (content.includes('export async function DELETE')) {
      const badOrderPattern = /export\s+async\s+function\s+DELETE\s*\(\s*{\s*params\s*}[^)]*,\s*req\s*:\s*NextRequest/;
      if (badOrderPattern.test(content)) {
        console.log('  ⚠️ Found incorrectly ordered DELETE parameters');
        content = content.replace(
          badOrderPattern,
          `export async function DELETE(req: NextRequest, { params }: { params: { ${paramName || 'id'}: string } }`
        );
        wasUpdated = true;
      }
      
      const oldContextPattern = /export\s+async\s+function\s+DELETE\s*\(\s*req\s*:\s*NextRequest\s*,\s*context\s*:[^)]*\)/;
      if (oldContextPattern.test(content)) {
        console.log('  ⚠️ Found old context parameter pattern in DELETE');
        content = content.replace(
          oldContextPattern,
          `export async function DELETE(req: NextRequest, { params }: { params: { ${paramName || 'id'}: string } })`
        );
        wasUpdated = true;
      }
    }
    
    // Fix PATCH handlers
    if (content.includes('export async function PATCH')) {
      const badOrderPattern = /export\s+async\s+function\s+PATCH\s*\(\s*{\s*params\s*}[^)]*,\s*req\s*:\s*NextRequest/;
      if (badOrderPattern.test(content)) {
        console.log('  ⚠️ Found incorrectly ordered PATCH parameters');
        content = content.replace(
          badOrderPattern,
          `export async function PATCH(req: NextRequest, { params }: { params: { ${paramName || 'id'}: string } }`
        );
        wasUpdated = true;
      }
      
      const oldContextPattern = /export\s+async\s+function\s+PATCH\s*\(\s*req\s*:\s*NextRequest\s*,\s*context\s*:[^)]*\)/;
      if (oldContextPattern.test(content)) {
        console.log('  ⚠️ Found old context parameter pattern in PATCH');
        content = content.replace(
          oldContextPattern,
          `export async function PATCH(req: NextRequest, { params }: { params: { ${paramName || 'id'}: string } })`
        );
        wasUpdated = true;
      }
    }

    // Save the updated file if changes were made
    if (wasUpdated) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Updated ${filePath}`);
      updatedCount++;
    } else {
      console.log(`  ✓ No updates needed`);
    }
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`  - ${routeFiles.length} files checked`);
console.log(`  - ${updatedCount} files updated`);
console.log(`  - ${errorCount} errors encountered`);

if (updatedCount === 0 && errorCount === 0) {
  console.log('✨ All route handlers appear to be correctly formatted for Next.js 15!');
} else if (updatedCount > 0) {
  console.log('🎉 Updates complete! Route handlers should now be compatible with Next.js 15.');
}
