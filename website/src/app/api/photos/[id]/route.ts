import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';
// Use our mock photo service instead of database
import { getPhotoById as getMockPhoto, ApiResponse } from '@/services/mockPhotoService';

// Define Photo type - matching our mockPhotoService
type Photo = {
  id: number | string;
  title: string;
  description: string;
  image_url: string;
  thumbnail_url: string;
  file_url?: string;
  category_id: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  tags?: string[];
  category: {
    id: number;
    name: string;
  };
};

/**
 * GET /api/photos/[id]
 * Get a single photo by ID
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Apply rate limiting - 60 requests per minute
    const rateLimit = await rateLimiter(req, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // In Next.js app router, params are passed as a parameter to the route handler
    // Extract the id from the params
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { message: 'Invalid photo ID' },
        { status: 400 }
      );
    }
    
    console.log(`[GET /api/photos/${id}] Fetching photo details`);
    
    try {
      // Use our mock photo service to get the photo
      const result = await getMockPhoto(id);
      
      if (!result.success || !result.data) {
        console.error('Photo not found:', id);
        return NextResponse.json(
          { message: 'Photo not found', error: true },
          { status: 404 }
        );
      }
      
      // Return the photo data
      return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
      console.error('Error fetching photo:', error);
      return NextResponse.json(
        { message: 'Error fetching photo', error: true },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching photo:', error);
    return NextResponse.json(
      { message: 'Error fetching photo' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/photos/[id]
 * Update a photo
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Apply rate limiting - 10 requests per minute for updates
    const rateLimit = await rateLimiter(req, 10);
    if (!rateLimit.success) {
      return NextResponse.json(
        { message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // In Next.js app router, params should be awaited before use
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { message: 'Invalid photo ID' },
        { status: 400 }
      );
    }
    
    console.log(`[PUT /api/photos/${id}] Updating photo`);
    
    try {
      // For the mock implementation, we'll just return success
      // In a real implementation, this would update the photo in the database
      const data = await req.json();
      
      // Get the existing photo first
      const photoResult = await getMockPhoto(id);
      
      if (!photoResult.success || !photoResult.data) {
        return NextResponse.json(
          { message: 'Photo not found', error: true },
          { status: 404 }
        );
      }
      
      // In a real implementation, this would update the database
      // For mock purposes, just return success with merged data
      const updatedPhoto = {
        ...photoResult.data,
        ...data,
        // Ensure the category is formatted correctly
        category: data.category || photoResult.data.category,
        id: params.id // Preserve original ID
      };
      
      return NextResponse.json(updatedPhoto, { status: 200 });
    } catch (error) {
      console.error('Error updating photo:', error);
      return NextResponse.json(
        { message: 'Error updating photo', error: true },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json(
      { message: 'Error updating photo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/photos/[id]
 * Delete a photo by ID
 * Requires authentication (will be implemented in the auth section)
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Apply rate limiting - 10 requests per minute for deletion
    const rateLimit = await rateLimiter(req, 10);
    if (!rateLimit.success) {
      return NextResponse.json(
        { message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get ID from params
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { message: 'Invalid photo ID' },
        { status: 400 }
      );
    }
    
    console.log(`[DELETE /api/photo/${id}] Deleting photo`);
    
    try {
      // Check if the photo exists in our mock service
      const photoResult = await getMockPhoto(id);
      
      if (!photoResult.success || !photoResult.data) {
        return NextResponse.json(
          { message: 'Photo not found', error: true },
          { status: 404 }
        );
      }
      
      // In a real implementation, we would delete from the database
      // For mock purposes, just return success
      return NextResponse.json({
        success: true,
        message: 'Photo deleted successfully'
      }, { status: 200 });
    } catch (error) {
      console.error('Error deleting photo:', error);
      return NextResponse.json(
        { message: 'Error deleting photo', error: true },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json(
      { message: 'Server error', error: true },
      { status: 500 }
    );
  }
}
