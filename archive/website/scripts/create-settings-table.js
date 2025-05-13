/**
 * Script to create site_settings table for MTP Collective website
 * Run with: node scripts/create-settings-table.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSettingsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Connected to the database');
  
  try {
    // Check if table exists
    const [tableCheck] = await connection.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = '${process.env.DB_NAME}' 
      AND table_name = 'site_settings'
    `);
    
    if (tableCheck[0].count > 0) {
      console.log('Table site_settings already exists');
    } else {
      // Create table
      await connection.execute(`
        CREATE TABLE site_settings (
          id INT NOT NULL AUTO_INCREMENT,
          site_name VARCHAR(100) NOT NULL DEFAULT 'MTP Collective',
          site_description TEXT,
          contact_email VARCHAR(100),
          logo_url VARCHAR(255),
          primary_color VARCHAR(20) DEFAULT '#000000',
          secondary_color VARCHAR(20) DEFAULT '#ffffff',
          social_media JSON,
          meta_tags JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('Table site_settings created successfully');

      // Insert default settings
      await connection.execute(`
        INSERT INTO site_settings (
          site_name, 
          site_description, 
          social_media, 
          meta_tags
        ) VALUES (
          'MTP Collective', 
          'Photography portfolio website', 
          '{"instagram":"","twitter":"","facebook":""}', 
          '{"title":"MTP Collective","description":"Photography portfolio website","keywords":"photography, portfolio, art"}'
        )
      `);
      console.log('Default settings inserted successfully');
    }
  } catch (error) {
    console.error('Error creating site_settings table:', error);
  } finally {
    await connection.end();
    console.log('Database connection closed');
  }
}

createSettingsTable().catch(console.error);
