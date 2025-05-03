/**
 * Logout API Endpoint
 * Clears the authentication cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import auth from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Clear the authentication cookie
    auth.clearAuthCookie();
    
    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Server error during logout' },
      { status: 500 }
    );
  }
}
