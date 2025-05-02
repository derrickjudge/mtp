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

    const photoId = parseInt(params.id);
    
    if (isNaN(photoId)) {
      return NextResponse.json(
        { message: 'Invalid photo ID' },
        { status: 400 }
      );
    }
    
    // Find the photo in the database with its category
    const photoResults = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM photos p
       JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [photoId]
    );
    
    if (!photoResults || (photoResults as any[]).length === 0) {
      return NextResponse.json(
        { message: 'Photo not found' },
        { status: 404 }
      );
    }
    
    const photo = (photoResults as any[])[0];
    
    // Get tags for the photo
    const tagResults = await db.query(
      `SELECT t.name 
       FROM tags t
       JOIN photo_tags pt ON t.id = pt.tag_id
       WHERE pt.photo_id = ?`,
      [photoId]
    );
    
    // Format the photo with category and tags
    const formattedPhoto = {
      ...photo,
      category: {
        id: photo.category_id,
        name: photo.category_name
      },
      tags: Array.isArray(tagResults) ? tagResults.map((tag: any) => tag.name) : []
    };
    
    // Convert snake_case properties to camelCase for API consistency
    if (formattedPhoto.file_url) {
      formattedPhoto.fileUrl = formattedPhoto.file_url;
      delete formattedPhoto.file_url;
    }
    
    if (formattedPhoto.thumbnail_url) {
      formattedPhoto.thumbnailUrl = formattedPhoto.thumbnail_url;
      delete formattedPhoto.thumbnail_url;
    }
    
    if (formattedPhoto.upload_date) {
      formattedPhoto.uploadDate = formattedPhoto.upload_date;
      delete formattedPhoto.upload_date;
    }
    
    return NextResponse.json(formattedPhoto, { status: 200 });
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

    // TODO: Add authentication check
    
    const photoId = parseInt(params.id);
    
    if (isNaN(photoId)) {
      return NextResponse.json(
        { message: 'Invalid photo ID' },
        { status: 400 }
      );
    }
    
    const { title, description, categoryId, tags, fileUrl, thumbnailUrl, width, height } = await req.json();
    
    // Find photo in database
    const photoResults = await db.query('SELECT * FROM photos WHERE id = ?', [photoId]);
    
    if (!photoResults || (photoResults as any[]).length === 0) {
      return NextResponse.json(
        { message: 'Photo not found' },
        { status: 404 }
      );
    }
    
    const photo = (photoResults as any[])[0];
    
    // If categoryId is provided, verify it exists
    if (categoryId) {
      const categoryResults = await db.query('SELECT * FROM categories WHERE id = ?', [Number(categoryId)]);
      
      if (!categoryResults || (categoryResults as any[]).length === 0) {
        return NextResponse.json(
          { message: 'Category not found' },
          { status: 404 }
        );
      }
    }
    
    // Use transaction for the update to ensure data consistency
    const updatedPhoto = await db.transaction(async (connection) => {
      // Build SET clause and parameters for the UPDATE query
      const updateFields = [];
      const updateParams = [];
      
      if (title !== undefined) {
        updateFields.push('title = ?');
        updateParams.push(title);
      }
      
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateParams.push(description);
      }
      
      if (categoryId !== undefined) {
        updateFields.push('categoryId = ?');
        updateParams.push(Number(categoryId));
      }
      
      if (fileUrl !== undefined) {
        updateFields.push('fileUrl = ?');
        updateParams.push(fileUrl);
      }
      
      if (thumbnailUrl !== undefined) {
        updateFields.push('thumbnailUrl = ?');
        updateParams.push(thumbnailUrl);
      }
      
      if (width !== undefined) {
        updateFields.push('width = ?');
        updateParams.push(Number(width));
      }
      
      if (height !== undefined) {
        updateFields.push('height = ?');
        updateParams.push(Number(height));
      }
      
      // Only update if there are fields to update
      if (updateFields.length > 0) {
        // Add photoId to params
        updateParams.push(photoId);
        
        // Execute update query
        await connection.execute(
          `UPDATE photos SET ${updateFields.join(', ')} WHERE id = ?`,
          updateParams
        );
      }
      
      // Update tags if provided
      if (tags && Array.isArray(tags)) {
        // Delete existing tags
        await connection.execute('DELETE FROM photo_tags WHERE photo_id = ?', [photoId]);
        
        // Add new tags
        for (const tagName of tags) {
          // Find tag or create it
          const [tagResults] = await connection.execute('SELECT * FROM tags WHERE name = ?', [tagName]);
          let tagId;
          
          if ((tagResults as any[]).length === 0) {
            // Create new tag
            const [newTagResult] = await connection.execute('INSERT INTO tags (name) VALUES (?)', [tagName]);
            tagId = (newTagResult as any).insertId;
          } else {
            tagId = (tagResults as any[])[0].id;
          }
          
          // Create relationship
          await connection.execute('INSERT INTO photo_tags (photo_id, tag_id) VALUES (?, ?)', [photoId, tagId]);
        }
      }
      
      // Get the updated photo with category info
      const [photoDetails] = await connection.execute(
        `SELECT p.*, c.name as category_name 
         FROM photos p
         JOIN categories c ON p.category_id = c.id 
         WHERE p.id = ?`,
        [photoId]
      );
      
      // Get tags for the photo
      const [tagDetails] = await connection.execute(
        `SELECT t.name 
         FROM tags t
         JOIN photo_tags pt ON t.id = pt.tag_id
         WHERE pt.photo_id = ?`,
        [photoId]
      );
      
      const updatedPhotoData = (photoDetails as any[])[0];
      const formattedPhoto = {
        ...updatedPhotoData,
        category: {
          id: updatedPhotoData.category_id,
          name: updatedPhotoData.category_name
        },
        tags: Array.isArray(tagDetails) ? tagDetails.map((tag: any) => tag.name) : []
      };
      
      // Convert snake_case properties to camelCase for API consistency
      if (formattedPhoto.file_url) {
        formattedPhoto.fileUrl = formattedPhoto.file_url;
        delete formattedPhoto.file_url;
      }
      
      if (formattedPhoto.thumbnail_url) {
        formattedPhoto.thumbnailUrl = formattedPhoto.thumbnail_url;
        delete formattedPhoto.thumbnail_url;
      }
      
      if (formattedPhoto.upload_date) {
        formattedPhoto.uploadDate = formattedPhoto.upload_date;
        delete formattedPhoto.upload_date;
      }
      
      return formattedPhoto;
    });
    
    return NextResponse.json(updatedPhoto, { status: 200 });
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

    // TODO: Add authentication check
    
    const photoId = parseInt(params.id);
    
    if (isNaN(photoId)) {
      return NextResponse.json(
        { message: 'Invalid photo ID' },
        { status: 400 }
      );
    }
    
    // Find the photo first to ensure it exists
    const photoResults = await db.query('SELECT * FROM photos WHERE id = ?', [photoId]);
    
    if (!photoResults || (photoResults as any[]).length === 0) {
      return NextResponse.json(
        { message: 'Photo not found' },
        { status: 404 }
      );
    }
    
    // Handle deletion within a transaction
    await db.transaction(async (connection) => {
      // Delete all associated photo tags first to avoid foreign key constraints
      await connection.execute('DELETE FROM photo_tags WHERE photo_id = ?', [photoId]);
      
      // Delete the photo
      await connection.execute('DELETE FROM photos WHERE id = ?', [photoId]);
    });
    
    return NextResponse.json({ message: 'Photo deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { message: 'Error deleting photo' },
      { status: 500 }
    );
  }
}
