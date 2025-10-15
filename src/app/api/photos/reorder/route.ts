import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { nativeDB } from '@/lib/db-native';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function PUT(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`photos:REORDER:${ip}`, { tokens: 100, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
    }
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const orderedPhotoIds: string[] = Array.isArray(body?.orderedPhotoIds) ? body.orderedPhotoIds : [];
    if (orderedPhotoIds.length === 0) {
      return NextResponse.json({ message: 'orderedPhotoIds required' }, { status: 400 });
    }

    await nativeDB.setGlobalPhotoOrdering(orderedPhotoIds);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error reordering photos:', error);
    return NextResponse.json({ message: 'Failed to reorder photos' }, { status: 500 });
  }
}


