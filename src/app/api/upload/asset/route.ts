import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { validateImageUpload, safeImageExtension } from '@/lib/uploadValidation';

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

    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check R2 configuration
    const r2Config = {
      bucketName: process.env.R2_BUCKET_NAME || '',
      publicUrl: process.env.R2_PUBLIC_URL || '',
      endpoint: process.env.R2_ENDPOINT || '',
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    };
    if (!r2Config.bucketName || !r2Config.publicUrl || !r2Config.endpoint || !r2Config.accessKeyId || !r2Config.secretAccessKey) {
      return NextResponse.json(
        { message: 'Storage not configured' },
        { status: 503 }
      );
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'assets';

    const validation = validateImageUpload(file);
    if (!validation.valid) {
      return NextResponse.json({ message: validation.message }, { status: validation.status });
    }

    // Validate folder name (only allow specific folders)
    const allowedFolders = ['logos', 'headers', 'assets'];
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json({ message: 'Invalid folder' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = safeImageExtension(file.type, file.name);
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
      { message: 'Failed to upload asset' },
      { status: 500 }
    );
  }
}

