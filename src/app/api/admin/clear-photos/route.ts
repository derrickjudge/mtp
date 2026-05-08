import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { nativeDB } from '@/lib/db-native';

export async function DELETE(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🗑️ Starting bulk photo deletion...');

    // Check if R2 is configured before importing photo service
    const hasR2Config = process.env.R2_BUCKET_NAME &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY;

    if (!hasR2Config) {
      return NextResponse.json(
        {
          message: 'Bulk photo deletion requires Cloudflare R2 configuration.',
          details: 'Missing R2_BUCKET_NAME, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY environment variables.'
        },
        { status: 503 }
      );
    }

    const { photoService } = await import('@/services/photoService');

    // Get all photos
    const photos = await nativeDB.findPhotos({ published: false }); // Get all photos including unpublished
    console.log(`📸 Found ${photos.length} photos to delete`);

    let deletedCount = 0;
    let errorCount = 0;

    // Delete each photo (this will remove from both database and R2)
    for (const photo of photos) {
      try {
        await photoService.deletePhoto(photo.id);
        deletedCount++;
        console.log(`✅ Deleted photo: ${photo.title} (${photo.id})`);
      } catch (error) {
        console.error(`❌ Failed to delete photo: ${photo.title} (${photo.id})`, error);
        errorCount++;
      }
    }

    console.log(`🎉 Bulk deletion complete: ${deletedCount} deleted, ${errorCount} errors`);

    return NextResponse.json({
      message: `Bulk deletion complete`,
      results: {
        totalFound: photos.length,
        deleted: deletedCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('Error during bulk photo deletion:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete photos' },
      { status: 500 }
    );
  }
}
