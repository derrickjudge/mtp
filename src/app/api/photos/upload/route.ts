import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { validateImageUpload } from '@/lib/uploadValidation';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`photos:UPLOAD:${ip}`, { tokens: 200, windowMs: 15 * 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
    }
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
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
    const tagIds = formData.getAll('tagIds') as string[];
    const eventIds = formData.getAll('eventIds') as string[];

    if (!title) {
      return NextResponse.json(
        { message: 'Title is required' },
        { status: 400 }
      );
    }

    const validation = validateImageUpload(file);
    if (!validation.valid) {
      return NextResponse.json({ message: validation.message }, { status: validation.status });
    }

    // Check if R2 is configured
    const hasR2Config = process.env.R2_BUCKET_NAME && 
                       process.env.R2_ACCESS_KEY_ID && 
                       process.env.R2_SECRET_ACCESS_KEY;

    if (!hasR2Config) {
      return NextResponse.json(
        { 
          message: 'Photo upload is not configured yet. Please set up Cloudflare R2 environment variables.',
          details: 'Missing R2_BUCKET_NAME, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY environment variables.'
        },
        { status: 503 }
      );
    }

    // If R2 is configured, use the original photoService
    const { photoService } = await import('@/services/photoService');
    
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
      tagIds,
      eventIds,
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
      { message: 'Failed to upload photo' },
      { status: 500 }
    );
  }
} 