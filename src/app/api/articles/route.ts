import { NextRequest, NextResponse } from 'next/server';
import { nativeDB } from '@/lib/db-native';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/articles - List all articles
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`articles:GET:${ip}`, { tokens: 60, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
    }
    const { searchParams } = new URL(req.url);
    const published = searchParams.get('published');
    const featured = searchParams.get('featured') === 'true';
    const categoryId = searchParams.get('category') || undefined;
    const tagId = searchParams.get('tag') || undefined;
    const take = searchParams.get('take') ? parseInt(searchParams.get('take')!) : undefined;
    const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : undefined;

    const articles = await nativeDB.findArticles({
      published: published === 'true' ? true : published === 'false' ? false : undefined,
      featured,
      categoryId,
      tagId,
      take,
      skip,
    });

    // Get articles with their categories and tags
    const articlesWithRelations = await Promise.all(
      articles.map(async (article) => {
        const articleWithRelations = await nativeDB.getArticleWithRelations(article.id);
        return articleWithRelations;
      })
    );

    return NextResponse.json(articlesWithRelations);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// POST /api/articles - Create new article
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { 
      title, 
      content, 
      excerpt, 
      published, 
      featured, 
      coverImage, 
      publishDate,
      authorId,
      categoryIds, 
      tagIds, 
      eventIds,
      metaDescription 
    } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { message: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Use provided authorId or default to current user
    const finalAuthorId = authorId || session.user.id;

    // Validate that the provided authorId exists if it's different from current user
    if (authorId && authorId !== session.user.id) {
      const author = await nativeDB.findUserById(authorId);
      if (!author) {
        return NextResponse.json(
          { message: 'Invalid author selected' },
          { status: 400 }
        );
      }
    }

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingArticle = await nativeDB.findArticleBySlug(slug);
    if (existingArticle) {
      return NextResponse.json(
        { message: 'An article with this title already exists' },
        { status: 409 }
      );
    }

    const article = await nativeDB.createArticle({
      title,
      slug,
      content,
      excerpt,
      published: published ?? false,
      featured: featured ?? false,
      coverImage,
      publishDate,
      metaDescription,
      authorId: finalAuthorId,
    });

    if (!article) {
      return NextResponse.json(
        { message: 'Failed to create article' },
        { status: 500 }
      );
    }

    // Link to categories, tags, and events if provided
    if (categoryIds && categoryIds.length > 0) {
      await nativeDB.linkArticleToCategories(article.id, categoryIds);
    }

    if (tagIds && tagIds.length > 0) {
      await nativeDB.linkArticleToTags(article.id, tagIds);
    }

    if (eventIds && eventIds.length > 0) {
      await nativeDB.linkArticleToEvents(article.id, eventIds);
    }

    // Get the article with its relations
    const articleWithRelations = await nativeDB.getArticleWithRelations(article.id);

    return NextResponse.json(articleWithRelations, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create article' },
      { status: 500 }
    );
  }
} 