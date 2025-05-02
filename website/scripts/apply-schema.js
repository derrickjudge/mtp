#!/usr/bin/env node

/**
 * Apply Database Schema Script
 * This script applies the SQL schema directly to the MySQL database
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

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
  database: process.env.DB_NAME || 'mtp_photography',
  multipleStatements: true // Important for running multiple SQL statements
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
      database: url.pathname.substring(1), // Remove leading slash
      multipleStatements: true
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

// Read the SQL schema file
const schemaFilePath = path.resolve(process.cwd(), 'prisma', 'schema.sql');
if (!fs.existsSync(schemaFilePath)) {
  console.error(`${colors.red}Schema file not found: ${schemaFilePath}${colors.reset}`);
  process.exit(1);
}

const schema = fs.readFileSync(schemaFilePath, 'utf8');
console.log(`${colors.green}Loaded schema file: ${schemaFilePath}${colors.reset}`);

// Apply schema to database
async function applySchema() {
  let connection;
  
  try {
    console.log(`${colors.blue}Connecting to MySQL database...${colors.reset}`);
    connection = await mysql.createConnection(connectionConfig);
    console.log(`${colors.green}Successfully connected to MySQL server${colors.reset}`);
    
    console.log(`${colors.blue}Applying schema...${colors.reset}`);
    await connection.query(schema);
    console.log(`${colors.green}Schema applied successfully${colors.reset}`);
    
    // Verify tables were created
    console.log(`${colors.blue}Verifying tables...${colors.reset}`);
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log(`${colors.red}No tables found in database.${colors.reset}`);
    } else {
      const tableNames = tables.map(row => Object.values(row)[0]);
      console.log(`${colors.green}Found tables: ${tableNames.join(', ')}${colors.reset}`);
      
      // Verify expected tables exist
      const expectedTables = ['categories', 'photos', 'tags', 'photo_tags', 'users'];
      const missingTables = expectedTables.filter(table => !tableNames.includes(table));
      
      if (missingTables.length > 0) {
        console.log(`${colors.red}Missing expected tables: ${missingTables.join(', ')}${colors.reset}`);
      } else {
        console.log(`${colors.green}All expected tables found!${colors.reset}`);
      }
    }
    
    console.log(`\n${colors.green}✓ Database setup completed successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Failed to apply schema:${colors.reset}`, error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log(`${colors.blue}Database connection closed${colors.reset}`);
    }
  }
}

applySchema();
