/**
 * Create Admin User Script
 * This script creates an initial admin user for the MTP Photography website
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const colors = require('colors/safe');

// Set up database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'mtp_user',
  password: process.env.DB_PASSWORD || 'mtp_password',
  database: process.env.DB_NAME || 'mtp_photography',
};

// Admin user credentials to create
// In production, generate a strong random password
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'mtp_admin_password',
  email: 'admin@mtpcollective.com',
  role: 'admin'
};

/**
 * Create admin user in database
 */
async function createAdminUser() {
  console.log(colors.yellow('=== Creating Admin User ==='));
  
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log(colors.green('✓ Connected to database'));
    
    // Check if users table exists, create if it doesn't
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
      [dbConfig.database]
    );
    
    if (tables.length === 0) {
      console.log(colors.cyan('Creating users table...'));
      
      await connection.query(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(100) NOT NULL,
          role ENUM('admin', 'user') DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log(colors.green('✓ Users table created'));
    }
    
    // Check if admin user already exists
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [DEFAULT_ADMIN.username, DEFAULT_ADMIN.email]
    );
    
    console.log(colors.cyan('Existing users check result:'), existingUsers.length ? 'Found' : 'None found');
    
    if (existingUsers.length > 0) {
      console.log(colors.yellow('Admin user already exists'));
      const user = existingUsers[0];
      console.log(colors.cyan('Existing user:'), {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        // Don't log the password hash for security
      });
      return;
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, salt);
    
    // Create admin user
    console.log(colors.cyan('Creating new admin user...'));
    try {
      const [result] = await connection.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [DEFAULT_ADMIN.username, DEFAULT_ADMIN.email, hashedPassword, DEFAULT_ADMIN.role]
      );
      
      console.log(colors.green(`✓ Admin user created with ID: ${result.insertId}`));
      console.log(colors.cyan('Username:'), DEFAULT_ADMIN.username);
      console.log(colors.cyan('Password:'), DEFAULT_ADMIN.password);
      console.log(colors.cyan('Role:'), DEFAULT_ADMIN.role);
      console.log(colors.yellow('Remember to change the default password in production!'));
    } catch (error) {
      console.error(colors.red('Error inserting admin user:'), error.message);
      
      // Check if the table exists but the insert failed for some other reason
      const [userCheck] = await connection.query(
        'SELECT * FROM users LIMIT 1'
      );
      console.log(colors.cyan('Users table exists with data:'), userCheck.length > 0 ? 'Yes' : 'No');
    }
    
  } catch (error) {
    console.error(colors.red('Error creating admin user:'), error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

// Run the script
createAdminUser().catch(console.error);
