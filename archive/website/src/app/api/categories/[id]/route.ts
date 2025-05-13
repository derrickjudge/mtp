/**
 * API route for individual category operations
 * Supports GET, PUT, DELETE operations on a single category
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { rateLimiter } from '@/lib/rate-limiter';

/**
 * Get a single category by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimiter(req);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate ID
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Query the database
    const result = await db.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    // Check if category exists
    if (!result || result.length === 0) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { message: 'Error fetching category' },
      { status: 500 }
    );
  }
}

/**
 * Update a category by ID
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimiter(req);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate ID
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Get request body
    const { name, description } = await req.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { message: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await db.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (!existingCategory || existingCategory.length === 0) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if name already exists (excluding current category)
    const nameExists = await db.query(
      'SELECT * FROM categories WHERE name = ? AND id != ?',
      [name, id]
    );

    if (nameExists && nameExists.length > 0) {
      return NextResponse.json(
        { message: 'Category with this name already exists' },
        { status: 409 }
      );
    }

    // Update category
    await db.query(
      'UPDATE categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?',
      [name, description || '', id]
    );

    // Get updated category
    const updatedCategory = await db.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    return NextResponse.json(updatedCategory[0], { status: 200 });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { message: 'Error updating category' },
      { status: 500 }
    );
  }
}

/**
 * Delete a category by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimiter(req);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate ID
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await db.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (!existingCategory || existingCategory.length === 0) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category is used by any photos
    const photosWithCategory = await db.query(
      'SELECT COUNT(*) as count FROM photos WHERE category_id = ?',
      [id]
    );

    if (photosWithCategory && photosWithCategory[0].count > 0) {
      return NextResponse.json(
        { 
          message: 'Cannot delete category that is used by photos',
          count: photosWithCategory[0].count 
        },
        { status: 409 }
      );
    }

    // Delete category
    await db.query(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );

    return NextResponse.json(
      { message: 'Category deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { message: 'Error deleting category' },
      { status: 500 }
    );
  }
}
