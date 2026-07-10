import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// GET /api/tags
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`tags:GET:${ip}`, { tokens: 60, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
    }
    // For now, return empty array since tags functionality isn't fully implemented
    // This prevents the PhotoEditModal from breaking when trying to fetch tags
    const res = NextResponse.json([]);
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.headers.set('CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { message: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
} 