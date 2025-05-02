import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';
import db from '@/lib/database';

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

    // Get categories from database
    const categories = await db.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    
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

    // Check if category already exists
    const existingCategories = await db.query(
      'SELECT * FROM categories WHERE name = ?',
      [name]
    );

    if (existingCategories && (existingCategories as any[]).length > 0) {
      return NextResponse.json(
        { message: 'Category with this name already exists' },
        { status: 409 }
      );
    }
    
    // Create new category
    const result = await db.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || '']
    );
    
    const newCategory = {
      id: (result as any).insertId,
      name,
      description: description || ''
    };
    
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { message: 'Error creating category' },
      { status: 500 }
    );
  }
}
