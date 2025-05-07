/**
 * Script to fix Next.js 15 Route Handler signatures
 * This updates route.ts files to use the correct parameter formats
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all route.ts files
const routeFiles = execSync('find /Users/djudge/repos/mtp/website/src/app/api -name "route.ts"', { encoding: 'utf8' })
  .trim()
  .split('\n');

console.log(`Found ${routeFiles.length} route handlers to update`);

// Regular expressions to match various route handler patterns
const patterns = [
  // Pattern for dynamic route parameters with context
  {
    find: /export\s+(?:async)?\s*function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*req\s*:\s*NextRequest\s*,\s*context\s*:\s*.*?\)\s*{/g,
    replace: (match, method) => `export async function ${method}(req: NextRequest, { params }: { params: Record<string, string> }) {`
  },
  // Pattern for accessing context.params
  {
    find: /context\.params\.([\w]+)/g,
    replace: (match, param) => `params.${param}`
  },
  // Pattern for routes with no parameters but still using context
  {
    find: /export\s+(?:async)?\s*function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*req\s*:\s*NextRequest\s*,\s*\{\s*\}\s*\)\s*{/g,
    replace: (match, method) => `export async function ${method}(req: NextRequest) {`
  }
];

// Process each file
let updatedFiles = 0;

routeFiles.forEach(filePath => {
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let newContent = originalContent;
    
    // Apply all patterns
    patterns.forEach(pattern => {
      newContent = newContent.replace(pattern.find, pattern.replace);
    });
    
    // Only write the file if changes were made
    if (newContent !== originalContent) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Updated: ${filePath}`);
      updatedFiles++;
    } else {
      console.log(`ℹ️ No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\nCompleted: ${updatedFiles} files updated`);
