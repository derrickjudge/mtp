import { NextRequest, NextResponse } from 'next/server';
import { photoService } from '@/services/photoService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
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