import { NextRequest, NextResponse } from 'next/server';
import { nativeDB } from '@/lib/db-native';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/events/[id] - Get single event by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const event = await nativeDB.getEventWithRelations(id);
    
    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update event
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
    const { name, description, date, location, coverImage, published, featured, categoryIds, photoIds, articleIds } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: 'Event name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists for a different event
    const existingEvent = await nativeDB.findEventBySlug(slug);
    if (existingEvent && existingEvent.id !== id) {
      return NextResponse.json(
        { message: 'An event with this name already exists' },
        { status: 409 }
      );
    }

    const updatedEvent = await nativeDB.updateEvent(id, {
      name,
      slug,
      description,
      date,
      location,
      coverImage,
      published: published ?? false,
      featured: featured ?? false,
    });

    if (!updatedEvent) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    // Clear existing relationships
    await nativeDB.clearEventCategories(id);
    await nativeDB.clearEventPhotos(id);
    await nativeDB.clearEventArticles(id);

    // Link to new categories, photos, and articles if provided
    if (categoryIds && categoryIds.length > 0) {
      await nativeDB.linkEventToCategories(id, categoryIds);
    }

    if (photoIds && photoIds.length > 0) {
      await nativeDB.linkEventToPhotos(id, photoIds);
    }

    if (articleIds && articleIds.length > 0) {
      await nativeDB.linkEventToArticles(id, articleIds);
    }

    // Get the event with its updated relations
    const eventWithRelations = await nativeDB.getEventWithRelations(id);

    return NextResponse.json(eventWithRelations);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete event
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
    const deleted = await nativeDB.deleteEvent(id);

    if (!deleted) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to delete event' },
      { status: 500 }
    );
  }
} 