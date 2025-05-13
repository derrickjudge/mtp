/**
 * Slug-based Article API Endpoint
 * Retrieve articles by slug (user-friendly URL)
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { requireRole } from '@/lib/secureAuth';
import { getArticleBySlug } from '@/services/mockArticleService';

// Create a rate limiter
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
  limit: 30, // 30 requests per minute
});

// Route context interface
interface RouteContext {
  params: {
    slug: string;
  };
}

/**
 * GET /api/articles/slug/[slug]
 * Get article by slug
 */
export async function GET(req: NextRequest, { params }: { params: Record<string, string> }) {
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

    const slug = params.slug;
    if (!slug) {
      return NextResponse.json({ message: 'Invalid article slug' }, { status: 400 });
    }
    
    console.log(`[API] GET /api/articles/slug/${slug} - Fetching article by slug`);
    
    // Get article from mock service
    const result = await getArticleBySlug(slug);
    
    if (!result.success || !result.data) {
      return NextResponse.json(
        { message: result.error || 'Article not found' },
        { status: 404 }
      );
    }
    
    const article = result.data;
    
    // Check if article is published or if user has permission to view unpublished articles
    if (!article.published) {
      const authCheck = await requireRole(req, 'user', false);
      if (!authCheck) {
        return NextResponse.json(
          { message: 'Article not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching article by slug:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
