import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';
// Using mock service for development instead of database connection
import { getCategories } from '@/services/mockPhotoService';

/**
 * GET /api/categories
 * Get all categories
 */
export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting - 60 requests per minute
    const rateLimit = await rateLimiter(req, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get categories from mock service
    const categories = await getCategories();
    
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: 'Error fetching categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create a new category
 * Requires authentication (will be implemented in the auth section)
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting - 10 requests per minute for creation endpoints
    const rateLimit = await rateLimiter(req, 10);
    if (!rateLimit.success) {
      return NextResponse.json(
        { message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // TODO: Add authentication check
    const { name, description } = await req.json();
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { message: 'Category name is required' },
        { status: 400 }
      );
    }

    // For development, just return a mock successful response
    // In a real implementation, this would check for duplicates and create a record in the database
    const mockCategory = {
      id: Math.floor(Math.random() * 1000) + 100,
      name,
      description: description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return NextResponse.json(mockCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { message: 'Error creating category' },
      { status: 500 }
    );
  }
}
