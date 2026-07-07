import { NextRequest, NextResponse } from 'next/server';
import { nativeDB } from '@/lib/db-native';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`categories:GET:${ip}`, { tokens: 60, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
    }
    
    const { searchParams } = new URL(req.url);
    const hierarchy = searchParams.get('hierarchy') === 'true';
    const parentId = searchParams.get('parentId');
    
    let categories;
    if (hierarchy) {
      // Return categories with nested children structure
      categories = await nativeDB.findCategoriesHierarchy();
    } else if (parentId !== null && parentId !== undefined) {
      // Return subcategories of a specific parent (or root categories if parentId is empty string)
      categories = await nativeDB.findCategoriesByParent(parentId === '' ? null : parentId);
    } else {
      // Return flat list of all categories
      categories = await nativeDB.findCategories();
    }
    
    const res = NextResponse.json(categories);
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.headers.set('CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: 'Failed to fetch categories' },
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

    const { name, description, showInNav, parentId } = await req.json();

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

    // If parentId is provided, verify it exists
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
          { message: 'Cannot create subcategory of a subcategory. Maximum 2 levels allowed.' },
          { status: 400 }
        );
      }
    }

    const category = await nativeDB.createCategory({
      name,
      slug,
      description: description || '',
      showInNav: showInNav !== false, // default true
      parentId: parentId || null
    });

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
      { message: 'Failed to create category' },
      { status: 500 }
    );
  }
} 