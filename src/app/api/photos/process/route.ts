import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { generateThumbnail, getImageDimensions } from '@/utils/imageProcessing';
import { validateImageUpload } from '@/lib/uploadValidation';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`photos:PROCESS:${ip}`, { tokens: 30, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    const validation = validateImageUpload(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: validation.status }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const thumbnailBuffer = await generateThumbnail(buffer);
    const dimensions = await getImageDimensions(buffer);

    // Convert buffers to base64 for response
    const thumbnailBase64 = thumbnailBuffer.toString('base64');
    const thumbnailDataUrl = `data:image/jpeg;base64,${thumbnailBase64}`;

    return NextResponse.json({
      thumbnail: thumbnailDataUrl,
      width: dimensions.width,
      height: dimensions.height,
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
