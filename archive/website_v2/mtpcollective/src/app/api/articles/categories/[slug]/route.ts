import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error';
import { z } from 'zod';
import { validateRequest } from '@/lib/validate';

const CategoryUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  slug: z.string().min(1, 'Slug is required').optional(),
  description: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: params.slug },
      include: {
        articles: {
          where: { published: true },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            coverImage: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        photos: {
          where: { published: true },
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            thumbnail: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userRole = req.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const existingCategory = await prisma.category.findUnique({
      where: { slug: params.slug },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const data = await validateRequest(CategoryUpdateSchema, await req.json());

    // If slug is being changed, ensure it's unique
    if (data.slug && data.slug !== params.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 409 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { slug: params.slug },
      data,
      include: {
        _count: {
          select: {
            articles: true,
            photos: true,
          },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userRole = req.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { slug: params.slug },
      include: {
        _count: {
          select: {
            articles: true,
            photos: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if category has articles or photos
    if (category._count.articles > 0 || category._count.photos > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with associated articles or photos' },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: { slug: params.slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
