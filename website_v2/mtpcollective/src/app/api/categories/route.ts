import { NextRequest, NextResponse } from 'next/server';
import { nativeDB } from '@/lib/db-native';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const categories = await nativeDB.findCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    // Check if category with this name already exists
    const existingCategory = await nativeDB.findCategoryByName(name);

    if (existingCategory) {
      return NextResponse.json(
        { message: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    const category = await nativeDB.createCategory(name, slug, description || '');

    if (!category) {
      return NextResponse.json(
        { message: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create category' },
      { status: 500 }
    );
  }
} 