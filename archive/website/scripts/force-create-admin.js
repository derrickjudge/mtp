/**
 * Force Create Admin User Script
 * This script forcibly creates a new admin user for the MTP Photography website
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
// Using very clear credentials for debugging
const NEW_ADMIN = {
  username: 'admin',
  password: 'admin123',
  email: 'admin@mtpcollective.com',
  role: 'admin'
};

/**
 * Force create admin user in database
 */
async function forceCreateAdminUser() {
  console.log(colors.yellow('=== Force Creating Admin User ==='));
  
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
    
    // Delete any existing admin user with same username
    console.log(colors.yellow('Deleting any existing admin user...'));
    await connection.query(
      'DELETE FROM users WHERE username = ? OR email = ?',
      [NEW_ADMIN.username, NEW_ADMIN.email]
    );
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(NEW_ADMIN.password, salt);
    
    // Log the hash for debugging
    console.log(colors.cyan('Password hash:'), hashedPassword);
    
    // Create admin user
    console.log(colors.cyan('Creating new admin user...'));
    const [result] = await connection.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [NEW_ADMIN.username, NEW_ADMIN.email, hashedPassword, NEW_ADMIN.role]
    );
    
    console.log(colors.green(`✓ Admin user created with ID: ${result.insertId}`));
    console.log(colors.cyan('Username:'), NEW_ADMIN.username);
    console.log(colors.cyan('Password:'), NEW_ADMIN.password);
    console.log(colors.cyan('Role:'), NEW_ADMIN.role);
    console.log(colors.yellow('This is a debug account - DO NOT use in production!'));
    
    // Verify the user was created correctly
    const [verifyUser] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [NEW_ADMIN.username]
    );
    
    if (verifyUser.length > 0) {
      const user = verifyUser[0];
      console.log(colors.green('✓ Verified user exists in database:'));
      console.log({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        password_length: user.password.length,
      });
    } else {
      console.log(colors.red('❌ Failed to verify user creation'));
    }
    
  } catch (error) {
    console.error(colors.red('Error creating admin user:'), error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

// Run the script
forceCreateAdminUser().catch(console.error);
