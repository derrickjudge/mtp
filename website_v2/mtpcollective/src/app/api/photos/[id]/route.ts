import { NextRequest, NextResponse } from 'next/server';
import { photoService } from '@/services/photoService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/photos/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const photo = await photoService.getPhotoById(id);
    if (!photo) {
      return NextResponse.json({ message: 'Photo not found' }, { status: 404 });
    }
    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch photo' },
      { status: 500 }
    );
  }
}

// PUT /api/photos/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { title, description, categoryIds, tagIds, eventIds, published, featured } = await req.json();

    if (!title) {
      return NextResponse.json(
        { message: 'Title is required' },
        { status: 400 }
      );
    }

    const updatedPhoto = await photoService.updatePhoto(id, {
      title,
      description,
      categoryIds: categoryIds || [],
      tagIds: tagIds || [],
      eventIds: eventIds || [],
      published: published ?? true,
      featured: featured ?? false,
    });

    return NextResponse.json(updatedPhoto);
  } catch (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update photo' },
      { status: 500 }
    );
  }
}

// DELETE /api/photos/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { id } = params;
    await photoService.deletePhoto(id);
    return NextResponse.json({ message: 'Photo deleted' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete photo' },
      { status: 500 }
    );
  }
} 