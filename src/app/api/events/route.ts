import { NextRequest, NextResponse } from 'next/server';
import { nativeDB } from '@/lib/db-native';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// GET /api/events - List all events
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`events:GET:${ip}`, { tokens: 60, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
    }
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';

    const { searchParams } = new URL(req.url);
    const publishedParam = searchParams.get('published');
    const featured = searchParams.get('featured') === 'true';
    const categoryId = searchParams.get('category') || undefined;
    const upcoming = searchParams.get('upcoming') === 'true';
    const take = searchParams.get('take') ? parseInt(searchParams.get('take')!) : undefined;
    const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : undefined;

    // Only admins may see unpublished events; everyone else is forced to published-only
    const published = isAdmin
      ? (publishedParam === 'true' ? true : publishedParam === 'false' ? false : undefined)
      : true;

    const events = await nativeDB.findEvents({
      published,
      featured,
      categoryId,
      upcoming,
      take,
      skip,
    });

    // Get events with their categories, photos, and articles
    const eventsWithRelations = await Promise.all(
      events.map(async (event) => {
        const eventWithRelations = await nativeDB.getEventWithRelations(event.id);
        return eventWithRelations;
      })
    );

    const res = NextResponse.json(eventsWithRelations);
    // Admin responses may contain unpublished events and must never reach the CDN cache
    if (isAdmin) {
      res.headers.set('Cache-Control', 'no-store');
    } else {
      res.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
      res.headers.set('CDN-Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    }
    return res;
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { message: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Check if slug already exists
    const existingEvent = await nativeDB.findEventBySlug(slug);
    if (existingEvent) {
      return NextResponse.json(
        { message: 'An event with this name already exists' },
        { status: 409 }
      );
    }

    const event = await nativeDB.createEvent({
      name,
      slug,
      description,
      date,
      location,
      coverImage,
      published: published ?? false,
      featured: featured ?? false,
      authorId: session.user.id,
    });

    if (!event) {
      return NextResponse.json(
        { message: 'Failed to create event' },
        { status: 500 }
      );
    }

    // Link to categories, photos, and articles if provided
    if (categoryIds && categoryIds.length > 0) {
      await nativeDB.linkEventToCategories(event.id, categoryIds);
    }

    if (photoIds && photoIds.length > 0) {
      await nativeDB.linkEventToPhotos(event.id, photoIds);
    }

    if (articleIds && articleIds.length > 0) {
      await nativeDB.linkEventToArticles(event.id, articleIds);
    }

    // Get the event with its relations
    const eventWithRelations = await nativeDB.getEventWithRelations(event.id);

    return NextResponse.json(eventWithRelations, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { message: 'Failed to create event' },
      { status: 500 }
    );
  }
} 