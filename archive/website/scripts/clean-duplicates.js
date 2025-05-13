/**
 * Database Cleanup Script
 * Identifies and removes duplicate records from the database
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const colors = require('colors/safe');

// Create database connection using environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'mtp_user',
  password: process.env.DB_PASSWORD || 'mtp_password',
  database: process.env.DB_NAME || 'mtp_photography',
};

// Track changes
let duplicatesFound = 0;
let duplicatesRemoved = 0;
let errors = 0;

/**
 * Clean duplicate photos
 */
async function cleanDuplicatePhotos(connection) {
  console.log(colors.cyan('\nScanning for duplicate photos...'));
  
  try {
    // Find duplicates based on title and file_url
    const [duplicates] = await connection.query(`
      SELECT title, file_url, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM photos
      GROUP BY title, file_url
      HAVING COUNT(*) > 1
    `);
    
    duplicatesFound += duplicates.length;
    
    if (duplicates.length === 0) {
      console.log(colors.green('✓ No duplicate photos found.'));
      return;
    }
    
    console.log(colors.yellow(`Found ${duplicates.length} sets of duplicate photos:`));
    
    // Process each set of duplicates
    for (const dup of duplicates) {
      console.log(colors.gray(`  - "${dup.title}" appears ${dup.count} times (IDs: ${dup.ids})`));
      
      // Get all IDs and keep only the lowest one
      const ids = dup.ids.split(',').map(id => parseInt(id, 10)).sort((a, b) => a - b);
      const keepId = ids[0];
      const removeIds = ids.slice(1);
      
      console.log(colors.cyan(`    Keeping ID ${keepId}, removing IDs ${removeIds.join(', ')}`));
      
      // Start a transaction to safely remove duplicates
      await connection.beginTransaction();
      
      try {
        // First remove photo_tags associations
        await connection.query('DELETE FROM photo_tags WHERE photo_id IN (?)', [removeIds]);
        
        // Then remove the duplicate photos
        const [result] = await connection.query('DELETE FROM photos WHERE id IN (?)', [removeIds]);
        
        duplicatesRemoved += result.affectedRows;
        console.log(colors.green(`    ✓ Removed ${result.affectedRows} duplicate photos`));
        
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        console.error(colors.red(`    ✗ Error removing duplicates: ${error.message}`));
        errors++;
      }
    }
  } catch (error) {
    console.error(colors.red(`Error scanning for duplicate photos: ${error.message}`));
    errors++;
  }
}

/**
 * Main cleanup function
 */
async function cleanupDatabase() {
  console.log(colors.yellow('=== Database Cleanup ==='));
  console.log(colors.gray(`Database: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`));
  
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log(colors.green('✓ Connected to database'));
    
    // Run cleanup operations
    await cleanDuplicatePhotos(connection);
    
    // Add other cleanup functions here as needed
    
    // Print summary
    console.log(colors.yellow('\n=== Cleanup Summary ==='));
    console.log(colors.cyan(`Duplicates found: ${duplicatesFound}`));
    console.log(colors.green(`Duplicates removed: ${duplicatesRemoved}`));
    console.log(colors.red(`Errors encountered: ${errors}`));
    
    process.exit(errors > 0 ? 1 : 0);
  } catch (error) {
    console.error(colors.red(`Database connection error: ${error.message}`));
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

// Run the cleanup
cleanupDatabase().catch(error => {
  console.error(colors.red('Unhandled error:', error));
  process.exit(1);
});
