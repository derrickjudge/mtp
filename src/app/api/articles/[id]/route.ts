import { NextRequest, NextResponse } from 'next/server';
import { nativeDB } from '@/lib/db-native';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { normalizeAuthorName, DEFAULT_AUTHOR_NAME } from '@/lib/articleValidation';
import { normalizeContentFormat, DEFAULT_CONTENT_FORMAT } from '@/lib/articleContent';

// GET /api/articles/[id] - Get single article
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const article = await nativeDB.getArticleWithRelations(id);
    
    if (!article) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }
    
    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { message: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

// PUT /api/articles/[id] - Update article
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const {
      title,
      content,
      contentFormat,
      excerpt,
      published,
      featured,
      coverImage,
      publishDate,
      authorName,
      categoryIds,
      tagIds,
      eventIds,
      photoIds
    } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { message: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Check if article exists
    const existingArticle = await nativeDB.findArticleById(id);
    if (!existingArticle) {
      return NextResponse.json(
        { message: 'Article not found' },
        { status: 404 }
      );
    }

    // The byline is free text so an article can credit an author without an
    // admin account. Omitted means "leave as-is"; an explicit blank value
    // resets to the default.
    const authorNameResult = authorName === undefined
      ? { valid: true as const, authorName: existingArticle.authorName || DEFAULT_AUTHOR_NAME }
      : normalizeAuthorName(authorName);
    if (!authorNameResult.valid) {
      return NextResponse.json(
        { message: authorNameResult.message },
        { status: authorNameResult.status }
      );
    }

    // Matches the byline handling above: omitting the format leaves the
    // article in whichever mode it was authored in.
    const contentFormatResult = contentFormat === undefined
      ? { valid: true as const, contentFormat: existingArticle.contentFormat || DEFAULT_CONTENT_FORMAT }
      : normalizeContentFormat(contentFormat);
    if (!contentFormatResult.valid) {
      return NextResponse.json(
        { message: contentFormatResult.message },
        { status: contentFormatResult.status }
      );
    }

    // Generate slug from title if title changed
    let slug = existingArticle.slug;
    if (title !== existingArticle.title) {
      slug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if new slug already exists
      const existingSlug = await nativeDB.findArticleBySlug(slug);
      if (existingSlug && existingSlug.id !== id) {
        return NextResponse.json(
          { message: 'An article with this title already exists' },
          { status: 409 }
        );
      }
    }

    // Update the article
    const updatedArticle = await nativeDB.updateArticle(id, {
      title,
      slug,
      content,
      contentFormat: contentFormatResult.contentFormat,
      excerpt,
      published: published ?? false,
      featured: featured ?? false,
      coverImage,
      publishDate,
      authorId: existingArticle.authorId,
      authorName: authorNameResult.authorName,
    });

    if (!updatedArticle) {
      return NextResponse.json(
        { message: 'Failed to update article' },
        { status: 500 }
      );
    }

    // Update category relationships
    await nativeDB.clearArticleCategories(id);
    if (categoryIds && categoryIds.length > 0) {
      await nativeDB.linkArticleToCategories(id, categoryIds);
    }

    // Update tag relationships
    await nativeDB.clearArticleTags(id);
    if (tagIds && tagIds.length > 0) {
      await nativeDB.linkArticleToTags(id, tagIds);
    }

    // Update event relationships
    await nativeDB.clearArticleEvents(id);
    if (eventIds && eventIds.length > 0) {
      await nativeDB.linkArticleToEvents(id, eventIds);
    }

    // Replace the photo set; the client-supplied array order becomes the
    // stored display order
    await nativeDB.clearArticlePhotos(id);
    if (photoIds && photoIds.length > 0) {
      await nativeDB.linkArticleToPhotos(id, photoIds);
    }

    // Get the updated article with relations
    const articleWithRelations = await nativeDB.getArticleWithRelations(id);

    return NextResponse.json(articleWithRelations);
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { message: 'Failed to update article' },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/[id] - Delete article
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Check if article exists
    const existingArticle = await nativeDB.findArticleById(id);
    if (!existingArticle) {
      return NextResponse.json(
        { message: 'Article not found' },
        { status: 404 }
      );
    }

    const success = await nativeDB.deleteArticle(id);
    
    if (!success) {
      return NextResponse.json(
        { message: 'Failed to delete article' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { message: 'Failed to delete article' },
      { status: 500 }
    );
  }
} 