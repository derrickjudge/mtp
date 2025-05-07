/**
 * Articles API Endpoint
 * Handles articles retrieval and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { requireRole } from '@/lib/secureAuth';
import { validateRequest, sanitizeObject } from '@/lib/validation';
import { 
  getArticles, 
  getPublishedArticles, 
  createArticle, 
  ArticleFilter, 
  NewArticle 
} from '@/services/mockArticleService';

// Create a rate limiter
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
  limit: 30, // 30 requests per minute
});

/**
 * GET /api/articles
 * Get articles with optional filtering and pagination
 */
export async function GET(req: NextRequest) {
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

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Build filter object
    const filter: ArticleFilter = {};
    
    // Only allow filtering by published status for admins/editors
    const authCheck = await requireRole(req, 'user', false);
    const isAdmin = authCheck && authCheck.role === 'admin';
    
    if (url.searchParams.has('category')) {
      filter.category_id = parseInt(url.searchParams.get('category') || '0');
    }
    
    if (url.searchParams.has('author')) {
      filter.author_id = parseInt(url.searchParams.get('author') || '0');
    }
    
    if (url.searchParams.has('tag')) {
      filter.tag = url.searchParams.get('tag') || '';
    }
    
    if (url.searchParams.has('search')) {
      filter.search = url.searchParams.get('search') || '';
    }
    
    if (url.searchParams.has('published') && isAdmin) {
      filter.published = url.searchParams.get('published') === 'true';
    } else if (!isAdmin) {
      // Non-admin users only see published articles
      filter.published = true;
    }
    
    console.log('[API] GET /api/articles', { page, limit, filter });
    
    // Fetch articles
    const result = isAdmin 
      ? await getArticles(page, limit, filter)
      : await getPublishedArticles(page, limit, filter);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.error || 'Failed to fetch articles' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles
 * Create a new article
 * Requires authentication and admin/editor role
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(req, 10); // Lower limit for POST operations
    } catch (error) {
      return NextResponse.json(
        { message: 'Rate limit exceeded, please try again later' },
        { status: 429 }
      );
    }
    
    // Require authentication (admin or editor role)
    const authCheck = await requireRole(req, 'user');
    if (!authCheck) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('[API] POST /api/articles - Creating article');
    
    // Parse and sanitize request body
    let articleData: NewArticle;
    try {
      const rawData = await req.json();
      articleData = sanitizeObject(rawData);
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!articleData.title || !articleData.content) {
      return NextResponse.json(
        { message: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // Set author ID to current user if not specified
    if (!articleData.author_id) {
      articleData.author_id = parseInt(authCheck.id);
    }
    
    // Create article
    const result = await createArticle(articleData);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.error || 'Failed to create article' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Article created successfully', article: result.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
