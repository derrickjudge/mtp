/**
 * Authentication Service
 * Handles user authentication against MySQL database
 */

import * as db from '@/lib/database';
import bcrypt from 'bcryptjs';
import auth from '@/lib/auth';

// Define user interface matching our MySQL users table structure
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  created_at?: string;
  updated_at?: string;
}

/**
 * Authenticate a user with username/email and password
 * @param usernameOrEmail - The username or email to authenticate
 * @param password - The plain text password to check
 * @returns User data and token if authenticated, null if not
 */
export async function authenticateUser(usernameOrEmail: string, password: string) {
  try {
    console.log(`Authentication attempt for user: ${usernameOrEmail}`);
    
    // Query the database for the user
    const users = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
      [usernameOrEmail, usernameOrEmail]
    );

    if (!users || users.length === 0) {
      console.log('User not found in database');
      return null;
    }

    const user = users[0] as User;
    console.log(`User found: ${user.username}, role: ${user.role}`);

    // Compare the provided password with the stored hash
    console.log('Comparing password hash...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Password hash comparison failed');
      return null;
    }
    
    console.log('Password hash match successful!');
    

    // Generate JWT token
    const token = auth.generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // Return user data (excluding password) and token
    const { password: _, ...userData } = user;
    return {
      user: userData,
      token
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Get user by ID
 * @param id - User ID
 * @returns User data without password
 */
export async function getUserById(id: number) {
  try {
    const users = await db.query(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    if (!users || users.length === 0) {
      return null;
    }

    return users[0] as Omit<User, 'password'>;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Update user password
 * @param userId - User ID
 * @param currentPassword - Current password for verification
 * @param newPassword - New password to set
 * @returns Success status
 */
export async function updatePassword(userId: number, currentPassword: string, newPassword: string) {
  try {
    // Get user with password
    const users = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!users || users.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const user = users[0] as User;

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return { success: false, message: 'Current password is incorrect' };
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, message: 'Server error updating password' };
  }
}

export default {
  authenticateUser,
  getUserById,
  updatePassword
};
