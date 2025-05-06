import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

// Import mock user service
import { getUsers, createUser, NewUser } from '@/services/mockUserService';

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

    console.log('[API] GET /api/users - Fetching users');
    
    // Use mock user service to get users
    const result = await getUsers();
    
    if (!result.success) {
      return NextResponse.json({ message: result.error || 'Failed to fetch users' }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
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

    console.log('[API] POST /api/users - Creating user');
    
    const requestData = await req.json();
    const { username, email, password, role } = requestData;
    
    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json({ message: 'Username, email, and password are required' }, { status: 400 });
    }
    
    // Create new user with mock service
    const newUser: NewUser = {
      username,
      email,
      password,  // In a real app, we'd hash this
      role: role || 'user'
    };
    
    const result = await createUser(newUser);
    
    if (!result.success) {
      return NextResponse.json({ message: result.error || 'Failed to create user' }, { status: 400 });
    }
    
    // Return success response with new user
    return NextResponse.json({
      message: 'User created successfully',
      user: result.data
    }, { status: 201 });
  } catch (err) {
    console.error('Error creating user:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
