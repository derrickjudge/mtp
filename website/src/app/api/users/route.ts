import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/database';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rateLimit';

// Create a rate limiter that allows 20 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
  limit: 20,
});

/**
 * GET /api/users
 * Get all users
 */
export async function GET(req: NextRequest) {
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

    // Query the database for users, excluding passwords
    const users = await db.query(
      'SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY id'
    );
    
    return NextResponse.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Create a new user
 */
export async function POST(req: NextRequest) {
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

    const { username, email, password, role } = await req.json();
    
    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json({ message: 'Username, email, and password are required' }, { status: 400 });
    }
    
    // Check if username or email already exists
    const existingUsers = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ message: 'Username or email already exists' }, { status: 400 });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert new user
    const result = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role || 'user']
    );
    
    // Return success response with new user ID
    return NextResponse.json({
      message: 'User created successfully',
      userId: result.insertId
    }, { status: 201 });
  } catch (err) {
    console.error('Error creating user:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
