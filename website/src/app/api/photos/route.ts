import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';
import db from '@/lib/database';

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
    const categoryName = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    
    // Use a subquery approach to get unique photos by title and file_url
    // This will effectively get one photo from each set of duplicates
    let query = `
      SELECT p.*, c.name as category_name, c.id as category_id 
      FROM photos p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id IN (
        SELECT MIN(id) FROM photos GROUP BY title, file_url
      )
    `;
    
    const queryParams: any[] = [];
    
    // Add category filter if provided
    if (categoryName && categoryName !== 'All') {
      query += ' WHERE c.name = ?';
      queryParams.push(categoryName);
    }
    
    // Add order by and pagination
    query += ' ORDER BY p.upload_date DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    // Count total unique photos for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM (SELECT MIN(p.id) FROM photos p JOIN categories c ON p.category_id = c.id GROUP BY p.title, p.file_url) as unique_photos';
    if (categoryName && categoryName !== 'All') {
      countQuery += ' WHERE c.name = ?';
    }
    
    // Execute both queries in parallel
    const [photos, totalResults] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, categoryName && categoryName !== 'All' ? [categoryName] : [])
    ]);
    
    // Get total count from results
    const totalPhotos = (totalResults as any[])[0].total;
    
    // Get tags for each photo
    const formattedPhotos = await Promise.all((photos as any[]).map(async (photo) => {
      const tagResults = await db.query(`
        SELECT t.name 
        FROM tags t
        JOIN photo_tags pt ON t.id = pt.tag_id
        WHERE pt.photo_id = ?
      `, [photo.id]);
      
      return {
        ...photo,
        category: {
          id: photo.category_id,
          name: photo.category_name
        },
        tags: Array.isArray(tagResults) ? tagResults.map((tag: any) => tag.name) : []
      };
    }));
    
    // Calculate total pages
    const totalPages = Math.ceil(totalPhotos / limit);
    
    // Return the photos along with pagination info
    return NextResponse.json({
      photos: formattedPhotos,
      pagination: {
        total: totalPhotos,
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
    
    // Verify that the category exists
    const categoryResult = await db.query('SELECT * FROM categories WHERE id = ?', [Number(categoryId)]);
    const category = (categoryResult as any[])[0];
    
    if (!category) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Create the new photo in the database using a transaction
    const photo = await db.transaction(async (connection) => {
      // Insert the photo
      const uploadDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const [photoResult] = await connection.execute(
        'INSERT INTO photos (title, description, category_id, file_url, thumbnail_url, width, height, upload_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [title, description, Number(categoryId), fileUrl, thumbnailUrl, width || 1200, height || 800, uploadDate]
      );
      
      const photoId = (photoResult as any).insertId;
      
      // Process tags if provided
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          // Find or create the tag
          const [tagResult] = await connection.execute('SELECT * FROM tags WHERE name = ?', [tagName]);
          let tagId;
          
          if ((tagResult as any[]).length === 0) {
            // Create the tag
            const [newTagResult] = await connection.execute('INSERT INTO tags (name) VALUES (?)', [tagName]);
            tagId = (newTagResult as any).insertId;
          } else {
            tagId = (tagResult as any[])[0].id;
          }
          
          // Create the relationship between photo and tag
          await connection.execute('INSERT INTO photo_tags (photoId, tagId) VALUES (?, ?)', [photoId, tagId]);
        }
      }
      
      // Get the full photo with category details
      const [photoDetails] = await connection.execute(
        'SELECT p.*, c.name as category_name FROM photos p JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
        [photoId]
      );
      
      // Get tags for the photo
      const [photoTags] = await connection.execute(
        'SELECT t.name FROM tags t JOIN photo_tags pt ON t.id = pt.tagId WHERE pt.photoId = ?',
        [photoId]
      );
      
      const fullPhoto = {
        ...(photoDetails as any[])[0],
        category: {
          id: Number(categoryId),
          name: category.name
        },
        tags: (photoTags as any[]).map(t => t.name)
      };
      
      // Convert snake_case properties to camelCase for API consistency
      if (fullPhoto.file_url) {
        fullPhoto.fileUrl = fullPhoto.file_url;
        delete fullPhoto.file_url;
      }
      
      if (fullPhoto.thumbnail_url) {
        fullPhoto.thumbnailUrl = fullPhoto.thumbnail_url;
        delete fullPhoto.thumbnail_url;
      }
      
      if (fullPhoto.upload_date) {
        fullPhoto.uploadDate = fullPhoto.upload_date;
        delete fullPhoto.upload_date;
      }
      
      return fullPhoto;
    });
    
    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error('Error creating photo:', error);
    return NextResponse.json(
      { message: 'Error creating photo' },
      { status: 500 }
    );
  }
}
