/**
 * API Test Script
 * Tests the API endpoints to ensure database connectivity and functionality
 */

const fetch = require('node-fetch');
const colors = require('colors/safe');

// Base URL for local testing
const API_BASE = 'http://localhost:3000/api';

// Endpoints to test
const ENDPOINTS = [
  { path: '/categories', method: 'GET', name: 'Get Categories' },
  { path: '/photos', method: 'GET', name: 'Get Photos' },
  { path: '/photos/1', method: 'GET', name: 'Get Single Photo' },
];

// Test results tracking
let passed = 0;
let failed = 0;

/**
 * Test a single API endpoint
 */
async function testEndpoint(endpoint) {
  try {
    console.log(colors.cyan(`Testing ${endpoint.method} ${endpoint.path} (${endpoint.name})...`));
    
    const response = await fetch(`${API_BASE}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Basic validation based on endpoint
    if (endpoint.path === '/categories' && (!Array.isArray(data) || data.length === 0)) {
      throw new Error('Expected categories array, got invalid response');
    }
    
    if (endpoint.path === '/photos' && (!data.photos || !Array.isArray(data.photos))) {
      throw new Error('Expected photos array, got invalid response');
    }
    
    if (endpoint.path === '/photos/1' && !data.id) {
      throw new Error('Expected single photo with ID, got invalid response');
    }
    
    console.log(colors.green(`✓ ${endpoint.name}: Success`));
    passed++;
    
    // Log a small preview of the response
    const preview = JSON.stringify(data).substring(0, 100) + '...';
    console.log(colors.gray(`  Response: ${preview}`));
    
  } catch (error) {
    console.log(colors.red(`✗ ${endpoint.name}: Failed - ${error.message}`));
    failed++;
  }
  
  console.log(); // Add some spacing
}

/**
 * Main test function
 */
async function runTests() {
  console.log(colors.yellow('=== Starting API Tests ==='));
  console.log(colors.gray(`Testing against: ${API_BASE}`));
  console.log();
  
  // Check if server is running
  try {
    await fetch(API_BASE);
  } catch (error) {
    console.log(colors.red('ERROR: API server is not running. Please start the Next.js server first.'));
    process.exit(1);
  }
  
  // Run all tests sequentially
  for (const endpoint of ENDPOINTS) {
    await testEndpoint(endpoint);
  }
  
  // Print summary
  console.log(colors.yellow('=== Test Results ==='));
  console.log(colors.green(`Passed: ${passed}`));
  console.log(colors.red(`Failed: ${failed}`));
  console.log(colors.yellow(`Total: ${passed + failed}`));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error(colors.red('Test runner error:', error));
  process.exit(1);
});
