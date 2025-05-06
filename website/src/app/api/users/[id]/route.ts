import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

// Import mock user service
import { getUserById, updateUser, deleteUser } from '@/services/mockUserService';

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
    const userIdNumber = parseInt(userId);
    
    if (isNaN(userIdNumber)) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }
    
    console.log(`[API] GET /api/users/${userId} - Fetching user details`);
    
    // Use mock service to get user
    const result = await getUserById(userIdNumber);
    
    if (!result.success) {
      return NextResponse.json({ message: result.error || 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.data);
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
    const userIdNumber = parseInt(userId);
    
    if (isNaN(userIdNumber)) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }
    
    console.log(`[API] PUT /api/users/${userId} - Updating user`);
    
    // Get update data from request
    const userData = await req.json();
    const { username, email, role } = userData;
    
    // If nothing to update, return early
    if (!username && !email && !role) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }
    
    // Use mock service to update user
    const result = await updateUser(userIdNumber, userData);
    
    if (!result.success) {
      return NextResponse.json({ message: result.error || 'Failed to update user' }, { status: result.error === 'User not found' ? 404 : 400 });
    }
    
    return NextResponse.json({ 
      message: 'User updated successfully',
      user: result.data
    });
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
    const userIdNumber = parseInt(userId);
    
    if (isNaN(userIdNumber)) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }
    
    console.log(`[API] DELETE /api/users/${userId} - Deleting user`);
    
    // Use mock service to delete user
    const result = await deleteUser(userIdNumber);
    
    if (!result.success) {
      // Check specific error types
      if (result.error === 'User not found') {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      } else if (result.error === 'Cannot delete the primary admin user') {
        return NextResponse.json({ message: 'Cannot delete admin user' }, { status: 403 });
      } else {
        return NextResponse.json({ message: result.error || 'Failed to delete user' }, { status: 400 });
      }
    }
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
