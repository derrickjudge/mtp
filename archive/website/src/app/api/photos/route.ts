import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';
// Using mock service for development instead of database connection
import { getPhotos, getFeaturedPhotos } from '@/services/mockPhotoService';

// Define Photo type
type Photo = {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  fileUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  uploadDate: Date;
  category?: {
    id: number;
    name: string;
  };
  tags?: string[];
}

/**
 * GET /api/photos
 * Get all photos with optional category filter
 * 
 * Query parameters:
 * - category: Category name to filter by
 * - limit: Maximum number of photos to return
 * - page: Page number for pagination
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

    const { searchParams } = new URL(req.url);
    const categoryIdStr = searchParams.get('category_id');
    const categoryId = categoryIdStr ? parseInt(categoryIdStr) : undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const featured = searchParams.get('featured') === 'true';
    
    // Use our mock photo service instead of database queries
    let result;
    
    if (featured) {
      // Get featured photos
      const featuredPhotos = await getFeaturedPhotos(limit);
      result = {
        photos: featuredPhotos,
        total: featuredPhotos.length
      };
    } else {
      // Get regular photos with pagination
      result = await getPhotos(page, limit, categoryId);
    }
    
    // Format the API response  
    const totalPages = Math.ceil(result.total / limit);
    
    return NextResponse.json({
      photos: result.photos,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { message: 'Error fetching photos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/photos
 * Create a new photo
 * Requires authentication (will be implemented in the auth section)
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting - 10 uploads per minute
    const rateLimit = await rateLimiter(req, 10);
    if (!rateLimit.success) {
      return NextResponse.json(
        { message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // TODO: Add authentication check
    const { title, description, categoryId, tags = [], fileUrl, thumbnailUrl, width = 1200, height = 800 } = await req.json();
    
    // Validate required fields
    if (!title || !description || !categoryId || !fileUrl || !thumbnailUrl) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // For development, just return a mock successful response
    // In a real implementation, this would create a record in the database
    const mockPhoto = {
      id: Math.floor(Math.random() * 1000) + 100,
      title,
      description,
      categoryId: Number(categoryId),
      fileUrl,
      thumbnailUrl,
      width: width || 1200,
      height: height || 800,
      uploadDate: new Date(),
      category: {
        id: Number(categoryId),
        name: categoryId === 1 ? 'Nature' : 
              categoryId === 2 ? 'Street' : 
              categoryId === 3 ? 'Portrait' : 'Architecture'
      },
      tags: tags || []
    };
    
    return NextResponse.json(mockPhoto, { status: 201 });
  } catch (error) {
    console.error('Error creating photo:', error);
    return NextResponse.json(
      { message: 'Error creating photo' },
      { status: 500 }
    );
  }
}
