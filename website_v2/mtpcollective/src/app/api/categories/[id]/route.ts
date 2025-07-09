import { NextRequest, NextResponse } from 'next/server';
import { prisma, withPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: 'Category name is required' },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if category exists
    const existingCategory = await withPrisma(async (client) => {
      return await client.category.findUnique({
        where: { id: params.id },
      });
    });

    if (!existingCategory) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if name is already taken by another category
    const nameConflict = await withPrisma(async (client) => {
      return await client.category.findFirst({
        where: {
          name,
          id: { not: params.id },
        },
      });
    });

    if (nameConflict) {
      return NextResponse.json(
        { message: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    const category = await withPrisma(async (client) => {
      return await client.category.update({
        where: { id: params.id },
        data: {
          name,
          slug,
          description: description || '',
        },
      });
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if category exists
    const existingCategory = await withPrisma(async (client) => {
      return await client.category.findUnique({
        where: { id: params.id },
        include: {
          photos: true,
        },
      });
    });

    if (!existingCategory) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has photos
    if (existingCategory.photos.length > 0) {
      return NextResponse.json(
        { 
          message: `Cannot delete category "${existingCategory.name}" because it contains ${existingCategory.photos.length} photo(s). Please move or delete the photos first.` 
        },
        { status: 409 }
      );
    }

    await withPrisma(async (client) => {
      return await client.category.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete category' },
      { status: 500 }
    );
  }
} 