import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/database';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rateLimit';

// Create a rate limiter that allows 10 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
  limit: 10,
});

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/users/[id]
 * Get user by ID
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(req);
    } catch (error) {
      return NextResponse.json(
        { message: 'Rate limit exceeded, please try again later' },
        { status: 429 }
      );
    }

    const userId = context.params.id;
    
    // Query the database for the user, excluding password
    const users = await db.query(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(users[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

/**
 * PUT /api/users/[id]
 * Update user by ID
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(req);
    } catch (error) {
      return NextResponse.json(
        { message: 'Rate limit exceeded, please try again later' },
        { status: 429 }
      );
    }

    const userId = context.params.id;
    const { username, email, role, password } = await req.json();
    
    // Check if user exists
    const existingUserResult = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (!existingUserResult || existingUserResult.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Check if username or email is already taken by another user
    if (username || email) {
      const checkDuplicateQuery = 'SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?';
      const duplicateParams = [
        username || existingUserResult[0].username, 
        email || existingUserResult[0].email, 
        userId
      ];
      
      const duplicateCheck = await db.query(checkDuplicateQuery, duplicateParams);
      
      if (duplicateCheck && duplicateCheck.length > 0) {
        return NextResponse.json({ message: 'Username or email already in use by another account' }, { status: 400 });
      }
    }
    
    // Prepare update query
    let updateFields = [];
    let updateParams = [];
    
    if (username) {
      updateFields.push('username = ?');
      updateParams.push(username);
    }
    
    if (email) {
      updateFields.push('email = ?');
      updateParams.push(email);
    }
    
    if (role) {
      updateFields.push('role = ?');
      updateParams.push(role);
    }
    
    // Handle password update if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.push('password = ?');
      updateParams.push(hashedPassword);
    }
    
    // Add userId to params
    updateParams.push(userId);
    
    // If nothing to update, return early
    if (updateFields.length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }
    
    // Update user in database
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    await db.query(updateQuery, updateParams);
    
    return NextResponse.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/users/[id]
 * Delete user by ID
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(req);
    } catch (error) {
      return NextResponse.json(
        { message: 'Rate limit exceeded, please try again later' },
        { status: 429 }
      );
    }

    const userId = context.params.id;
    
    // Check if user exists
    const existingUser = await db.query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );
    
    if (!existingUser || existingUser.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Prevent deletion of admin users
    if (existingUser[0].role === 'admin') {
      return NextResponse.json({ message: 'Cannot delete admin user' }, { status: 403 });
    }
    
    // Delete user from database
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
