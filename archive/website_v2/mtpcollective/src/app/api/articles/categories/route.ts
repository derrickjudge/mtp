import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error';
import { z } from 'zod';
import { validateRequest } from '@/lib/validate';

const CategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: {
            articles: true,
            photos: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userRole = req.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const data = await validateRequest(CategorySchema, await req.json());

    // Check for unique slug
    const existingCategory = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
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
