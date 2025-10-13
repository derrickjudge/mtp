import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { nativeDB } from '@/lib/db-native';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`categories:photos:GET:${ip}`, { tokens: 60, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
    }
    // Reuse findPhotos filtered by category; already orders by category position
    const photos = await nativeDB.findPhotos({ categoryId: params.id });
    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error fetching category photos:', error);
    return NextResponse.json({ message: 'Failed to fetch category photos' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`categories:photos:PUT:${ip}`, { tokens: 50, windowMs: 15 * 60_000 });
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

    // Implement with direct SQL updates via nativeDB
    await nativeDB.ensureJunctionTables();
    // Set positions and top flags transactionally
    // Use internal helper via client to avoid circular imports
    const clientFactory = (nativeDB as any).createClient.bind(nativeDB);
    const client = clientFactory();
    await client.connect();
    try {
      await client.query('BEGIN');
      if (orderedPhotoIds.length > 0) {
        const placeholders = orderedPhotoIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO "_CategoryToPhoto" ("A", "B") VALUES ${placeholders} ON CONFLICT ("A","B") DO NOTHING`,
          [params.id, ...orderedPhotoIds]
        );
      }
      for (let i = 0; i < orderedPhotoIds.length; i++) {
        await client.query(`UPDATE "_CategoryToPhoto" SET position = $3 WHERE "A" = $1 AND "B" = $2`, [params.id, orderedPhotoIds[i], i]);
      }
      await client.query(`UPDATE "_CategoryToPhoto" SET is_top_selection = FALSE WHERE "A" = $1`, [params.id]);
      if (topPhotoIds.length > 0) {
        const tops = topPhotoIds.map((_, i) => `$${i + 2}`).join(', ');
        await client.query(`UPDATE "_CategoryToPhoto" SET is_top_selection = TRUE WHERE "A" = $1 AND "B" IN (${tops})`, [params.id, ...topPhotoIds]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      await client.end();
    }

    const refreshed = await nativeDB.findPhotos({ categoryId: params.id });
    return NextResponse.json({ photos: refreshed });
  } catch (error) {
    console.error('Error updating category photo curation:', error);
    return NextResponse.json({ message: 'Failed to update category photo curation' }, { status: 500 });
  }
}


