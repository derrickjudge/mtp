import { NextRequest, NextResponse } from 'next/server';
import { photoService } from '@/services/photoService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/photos?category=concert&tag=music&event=eventId&featured=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category') || undefined;
    const tagId = searchParams.get('tag') || undefined;
    const eventId = searchParams.get('event') || undefined;
    const featured = searchParams.get('featured') === 'true' ? true : undefined;
    const takeParam = searchParams.get('take');
    const skipParam = searchParams.get('skip');
    const take = takeParam ? parseInt(takeParam) : undefined;
    const skip = skipParam ? parseInt(skipParam) : undefined;

    const photos = await photoService.getPhotos({ categoryId, tagId, eventId, featured, take, skip });
    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

// POST /api/photos (multipart/form-data)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const categoryIds = formData.getAll('categoryIds') as string[];
    const tags = formData.getAll('tags') as string[];

    if (!file || !title) {
      return NextResponse.json(
        { message: 'File and title are required' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload photo
    const photo = await photoService.uploadPhoto({
      file: buffer,
      fileName: file.name,
      contentType: file.type,
      title,
      description,
      categoryIds,
      tagIds: [], // We'll handle tags separately
      authorId: session.user.id,
      metadata: {
        originalName: file.name,
        size: file.size,
        type: file.type,
      },
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to upload photo' },
      { status: 500 }
    );
  }
} 