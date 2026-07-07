import { NextRequest, NextResponse } from 'next/server';
import { nativeDB } from '@/lib/db-native';
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

    const { name, description, showInNav, parentId } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: 'Category name is required' },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if category exists
    const existingCategory = await nativeDB.findCategoryById(params.id);

    if (!existingCategory) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if name is already taken by another category
    const nameConflict = await nativeDB.findCategoryByName(name);

    if (nameConflict && nameConflict.id !== params.id) {
      return NextResponse.json(
        { message: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Prevent setting self as parent
    if (parentId === params.id) {
      return NextResponse.json(
        { message: 'A category cannot be its own parent' },
        { status: 400 }
      );
    }

    // If parentId is provided, verify it exists and is not a child of this category
    if (parentId) {
      const parentCategory = await nativeDB.findCategoryById(parentId);
      if (!parentCategory) {
        return NextResponse.json(
          { message: 'Parent category not found' },
          { status: 400 }
        );
      }
      // Prevent nesting more than 2 levels deep
      if (parentCategory.parentId) {
        return NextResponse.json(
          { message: 'Cannot set a subcategory as parent. Maximum 2 levels allowed.' },
          { status: 400 }
        );
      }
      // Prevent circular reference (parent is a child of this category)
      if (parentCategory.parentId === params.id) {
        return NextResponse.json(
          { message: 'Cannot create circular parent-child relationship' },
          { status: 400 }
        );
      }
    }

    const category = await nativeDB.updateCategory(params.id, {
      name,
      slug,
      description: description || '',
      showInNav: showInNav !== false, // default true
      parentId: parentId || null
    });

    if (!category) {
      return NextResponse.json(
        { message: 'Failed to update category' },
        { status: 500 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { message: 'Failed to update category' },
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

    // Check if category exists and get photo count
    const existingCategory = await nativeDB.getCategoryWithPhotos(params.id);

    if (!existingCategory) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has photos
    const photoCount = parseInt(existingCategory.photo_count) || 0;
    if (photoCount > 0) {
      return NextResponse.json(
        { 
          message: `Cannot delete category "${existingCategory.name}" because it contains ${photoCount} photo(s). Please move or delete the photos first.` 
        },
        { status: 409 }
      );
    }

    await nativeDB.deleteCategory(params.id);

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { message: 'Failed to delete category' },
      { status: 500 }
    );
  }
} 