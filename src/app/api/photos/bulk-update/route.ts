import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { nativeDB } from '@/lib/db-native';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function PUT(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const rl = rateLimit(`photos:BULK:${ip}`, { tokens: 50, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { photoIds, categoryIds, mode } = await req.json();

    // Validate input
    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { message: 'photoIds is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { message: 'categoryIds is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!mode || !['add', 'remove', 'set'].includes(mode)) {
      return NextResponse.json(
        { message: 'mode is required and must be "add", "remove", or "set"' },
        { status: 400 }
      );
    }

    // Verify all photos exist
    const existingPhotos = await Promise.all(
      photoIds.map(id => nativeDB.findPhotoById(id))
    );
    
    const missingPhotos = photoIds.filter((id, index) => !existingPhotos[index]);
    if (missingPhotos.length > 0) {
      return NextResponse.json(
        { message: `Photos not found: ${missingPhotos.join(', ')}` },
        { status: 404 }
      );
    }

    // Verify all categories exist
    const existingCategories = await Promise.all(
      categoryIds.map(id => nativeDB.findCategoryById(id))
    );
    
    const missingCategories = categoryIds.filter((id, index) => !existingCategories[index]);
    if (missingCategories.length > 0) {
      return NextResponse.json(
        { message: `Categories not found: ${missingCategories.join(', ')}` },
        { status: 404 }
      );
    }

    // Perform bulk update based on mode
    let updatedCount = 0;
    const errors: { photoId: string; error: string }[] = [];
    
    for (const photoId of photoIds) {
      try {
        switch (mode) {
          case 'add':
            // Add categories to photo (keeps existing)
            await nativeDB.linkPhotoToCategories(photoId, categoryIds);
            break;
            
          case 'remove':
            // Remove specific categories from photo
            await nativeDB.unlinkPhotoFromCategories(photoId, categoryIds);
            break;
            
          case 'set':
            // Replace all categories with the selected ones
            await nativeDB.clearPhotoCategories(photoId);
            await nativeDB.linkPhotoToCategories(photoId, categoryIds);
            break;
        }
        updatedCount++;
      } catch (error) {
        console.error(`Bulk update error for photo ${photoId}:`, error);
        errors.push({
          photoId,
          error: 'Unknown error'
        });
      }
    }

    // Return appropriate response based on success/failures
    if (errors.length > 0 && updatedCount === 0) {
      return NextResponse.json({
        message: `Failed to update any photos`,
        updatedCount: 0,
        errors
      }, { status: 500 });
    }
    
    return NextResponse.json({
      message: errors.length > 0 
        ? `Updated ${updatedCount}/${photoIds.length} photos (${errors.length} failed)`
        : `Successfully updated ${updatedCount} photos`,
      updatedCount,
      totalRequested: photoIds.length,
      mode,
      ...(errors.length > 0 && { errors })
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

