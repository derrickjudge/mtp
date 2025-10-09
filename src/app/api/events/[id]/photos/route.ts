import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { nativeDB } from '@/lib/db-native';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// GET: return curated photos for an event ordered by position
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`events:photos:GET:${ip}`, { tokens: 60, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
    }

    const event = await nativeDB.getEventWithRelations(params.id);
    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    // photos already ordered in getEventWithRelations
    return NextResponse.json({ photos: event.photos });
  } catch (error) {
    console.error('Error fetching event photos:', error);
    return NextResponse.json({ message: 'Failed to fetch event photos' }, { status: 500 });
  }
}

// PUT: set ordering and top selections for an event's photos
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`events:photos:PUT:${ip}`, { tokens: 50, windowMs: 15 * 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { orderedPhotoIds, topPhotoIds } = await req.json();
    if (!Array.isArray(orderedPhotoIds) || !Array.isArray(topPhotoIds)) {
      return NextResponse.json({ message: 'orderedPhotoIds and topPhotoIds arrays are required' }, { status: 400 });
    }

    await nativeDB.setEventPhotoCuration(params.id, orderedPhotoIds, topPhotoIds);
    const event = await nativeDB.getEventWithRelations(params.id);
    return NextResponse.json({ photos: event?.photos || [] });
  } catch (error) {
    console.error('Error updating event photo curation:', error);
    return NextResponse.json({ message: 'Failed to update event photo curation' }, { status: 500 });
  }
}


