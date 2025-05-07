/**
 * Single Article API Endpoint
 * Handles single article retrieval, updates, and deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { requireRole } from '@/lib/secureAuth';
import { sanitizeObject } from '@/lib/validation';
import { 
  getArticleById, 
  updateArticle, 
  deleteArticle 
} from '@/services/mockArticleService';

// Create a rate limiter with stricter limits for article operations
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
  limit: 20, // 20 requests per minute
});

/**
 * GET /api/articles/[id]
 * Get article by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    try {
      // Get client identifier from headers
      const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
      await limiter.check(clientId);
    } catch (error) {
      return NextResponse.json(
        { message: 'Rate limit exceeded, please try again later' },
        { status: 429 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid article ID' }, { status: 400 });
    }
    
    console.log(`[API] GET /api/articles/${id} - Fetching article details`);
    
    // Get article from mock service
    const result = await getArticleById(id);
    
    if (!result.success || !result.data) {
      return NextResponse.json(
        { message: result.error || 'Article not found' },
        { status: 404 }
      );
    }
    
    const article = result.data;
    
    // Check if article is published or if user has permission to view unpublished articles
    if (!article.published) {
      const authCheck = await requireRole(request, 'user');
      if (!authCheck) {
        return NextResponse.json(
          { message: 'Article not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/articles/[id]
 * Update article by ID
 * Requires authentication and admin/editor role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    try {
      // Get client identifier from headers
      const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
      await limiter.check(clientId); // Lower limit for PUT operations
    } catch (error) {
      return NextResponse.json(
        { message: 'Rate limit exceeded, please try again later' },
        { status: 429 }
      );
    }
    
    // Require authentication (admin or editor role)
    const authCheck = await requireRole(request, 'user');
    if (!authCheck) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid article ID' }, { status: 400 });
    }
    
    console.log(`[API] PUT /api/articles/${id} - Updating article`);
    
    // Parse and sanitize request body
    let articleData;
    try {
      const rawData = await request.json();
      articleData = sanitizeObject(rawData);
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Update article
    const result = await updateArticle(id, articleData);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.error || 'Failed to update article' },
        { status: result.error === 'Article not found' ? 404 : 400 }
      );
    }
    
    return NextResponse.json({
      message: 'Article updated successfully',
      article: result.data
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/articles/[id]
 * Delete article by ID
 * Requires authentication and admin role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    try {
      // Get client identifier from headers
      const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
      await limiter.check(clientId); // Strict limit for DELETE operations
    } catch (error) {
      return NextResponse.json(
        { message: 'Rate limit exceeded, please try again later' },
        { status: 429 }
      );
    }
    
    // Require authentication with admin role
    const authCheck = await requireRole(request, 'admin');
    if (!authCheck) {
      return NextResponse.json(
        { message: 'Unauthorized - Admin privileges required' },
        { status: 401 }
      );
    }
    
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid article ID' }, { status: 400 });
    }
    
    console.log(`[API] DELETE /api/articles/${id} - Deleting article`);
    
    // Delete article
    const result = await deleteArticle(id);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.error || 'Failed to delete article' },
        { status: result.error === 'Article not found' ? 404 : 400 }
      );
    }
    
    return NextResponse.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
