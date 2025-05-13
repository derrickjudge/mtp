/**
 * Article Categories API Endpoint
 * Handles article categories retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { getCategories } from '@/services/mockArticleService';

// Create a rate limiter
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
  limit: 30, // 30 requests per minute
});

/**
 * GET /api/articles/categories
 * Get all article categories
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
    
    console.log('[API] GET /api/articles/categories - Fetching categories');
    
    // Fetch categories
    const result = await getCategories();
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.error || 'Failed to fetch categories' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
