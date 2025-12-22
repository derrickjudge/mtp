import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Config } from '@/config/r2';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: r2Config.endpoint,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
});

/**
 * Asset upload endpoint - uploads files to R2 without creating Photo records.
 * Used for system assets like logos and page headers.
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const rl = rateLimit(`asset:upload:${ip}`, { tokens: 50, windowMs: 15 * 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { 
        status: 429, 
        headers: { 'Retry-After': String(rl.retryAfter) } 
      });
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check R2 configuration
    if (!r2Config.bucketName || !r2Config.publicUrl) {
      return NextResponse.json(
        { message: 'Storage not configured' },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'assets';

    if (!file) {
      return NextResponse.json({ message: 'File is required' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'File must be less than 10MB' }, { status: 400 });
    }

    // Validate folder name (only allow specific folders)
    const allowedFolders = ['logos', 'headers', 'assets'];
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json({ message: 'Invalid folder' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `${folder}/${randomUUID()}.${ext}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    const url = `${r2Config.publicUrl}/${key}`;

    return NextResponse.json({ url, key });
  } catch (error) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to upload asset' },
      { status: 500 }
    );
  }
}

