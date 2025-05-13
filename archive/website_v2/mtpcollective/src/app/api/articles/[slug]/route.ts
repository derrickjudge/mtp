import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, ApiError } from '@/lib/api-error';
import { validateRequest, ArticleSchema } from '@/lib/validate';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug: params.slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Only return published articles to non-authors
    const userId = req.headers.get('x-user-id');
    if (!article.published && article.authorId !== userId) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    
    // Verify article exists and user has permission
    const existingArticle = await prisma.article.findUnique({
      where: { slug: params.slug },
      select: { authorId: true },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Only allow author or admin to update
    if (existingArticle.authorId !== userId && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const data = await validateRequest(ArticleSchema, await req.json());
    const { categoryIds, tagIds, ...articleData } = data;

    // If slug is being changed, ensure it's unique
    if (articleData.slug !== params.slug) {
      const slugExists = await prisma.article.findUnique({
        where: { slug: articleData.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'An article with this slug already exists' },
          { status: 409 }
        );
      }
    }

    const updateData = {
      ...articleData,
      ...(categoryIds && {
        categories: {
          set: [],
          connect: categoryIds.map((id: string) => ({ id })),
        },
      }),
      ...(tagIds && {
        tags: {
          set: [],
          connect: tagIds.map((id: string) => ({ id })),
        },
      }),
    };

    const article = await prisma.article.update({
      where: { slug: params.slug },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    
    // Verify article exists and user has permission
    const article = await prisma.article.findUnique({
      where: { slug: params.slug },
      select: { authorId: true },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Only allow author or admin to delete
    if (article.authorId !== userId && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await prisma.article.delete({
      where: { slug: params.slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
