#!/usr/bin/env node

/**
 * MySQL Connection Test Script
 * Verifies that the MySQL connection can be established with current environment settings
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Colors for better readability
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

// Load environment variables
console.log(`${colors.blue}Loading environment variables...${colors.reset}`);
const envPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`${colors.green}Loaded environment from .env.local${colors.reset}`);
} else {
  dotenv.config();
  console.log(`${colors.yellow}No .env.local found, using default environment${colors.reset}`);
}

// Parse connection details
let connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'mtp_user',
  password: process.env.DB_PASSWORD || 'mtp_password',
  database: process.env.DB_NAME || 'mtp_photography'
};

// Parse DATABASE_URL if present
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    connectionConfig = {
      host: url.hostname,
      port: parseInt(url.port || '3306', 10),
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1) // Remove leading slash
    };
    console.log(`${colors.green}Using connection details from DATABASE_URL${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}Invalid DATABASE_URL format, using individual connection parameters${colors.reset}`);
  }
}

console.log(`${colors.blue}Connection settings:${colors.reset}`);
console.log(`Host: ${connectionConfig.host}`);
console.log(`Port: ${connectionConfig.port}`);
console.log(`User: ${connectionConfig.user}`);
console.log(`Database: ${connectionConfig.database}`);
console.log(`Password: ${'*'.repeat(connectionConfig.password.length)}`);

async function testConnection() {
  console.log(`\n${colors.blue}Testing MySQL connection...${colors.reset}`);
  
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(connectionConfig);
    console.log(`${colors.green}Successfully connected to MySQL server${colors.reset}`);
    
    // Test basic query
    console.log(`${colors.blue}Testing basic query...${colors.reset}`);
    const [result] = await connection.query('SELECT 1 + 1 AS sum');
    console.log(`${colors.green}Query successful: ${JSON.stringify(result[0])}${colors.reset}`);
    
    // Check for required tables
    console.log(`${colors.blue}Checking for required database tables...${colors.reset}`);
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log(`${colors.red}No tables found in database. Run migrations first.${colors.reset}`);
    } else {
      const tableNames = tables.map(row => Object.values(row)[0]);
      console.log(`${colors.green}Found tables: ${tableNames.join(', ')}${colors.reset}`);
      
      // Verify expected tables exist
      const expectedTables = ['categories', 'photos', 'tags', 'photo_tags', 'users'];
      const missingTables = expectedTables.filter(table => !tableNames.includes(table));
      
      if (missingTables.length > 0) {
        console.log(`${colors.red}Missing expected tables: ${missingTables.join(', ')}${colors.reset}`);
        console.log(`${colors.yellow}Run migrations with: docker-compose exec mysql mysql -u mtp_user -pmtp_password mtp_photography < ./db/migrations/001_initial_schema.sql${colors.reset}`);
      } else {
        console.log(`${colors.green}All expected tables found!${colors.reset}`);
      }
    }
    
    console.log(`\n${colors.green}✓ MySQL connection test completed successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Failed to connect to MySQL:${colors.reset}`, error);
    console.log(`\n${colors.yellow}Troubleshooting tips:${colors.reset}`);
    console.log(`1. Make sure MySQL container is running with: docker-compose ps`);
    console.log(`2. Check if MySQL service is accepting connections: docker-compose logs mysql`);
    console.log(`3. Verify your connection settings in .env.local match the Docker configuration`);
    console.log(`4. Try restarting the MySQL container: npm run db:teardown && npm run db:setup`);
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log(`${colors.blue}Connection closed${colors.reset}`);
    }
  }
}

testConnection();
