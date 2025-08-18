import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.NEXT_PUBLIC_CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(file: Buffer, key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_CLOUDFLARE_R2_BUCKET_NAME!,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await r2.send(command);
  return `${process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}

export async function processImage(file: Buffer) {
  // Generate full-size image (max 2000px width)
  const fullSize = await sharp(file)
    .resize(2000, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  // Generate thumbnail (400px width)
  const thumbnail = await sharp(file)
    .resize(400, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  // Get aspect ratio
  const metadata = await sharp(file).metadata();
  const aspectRatio = metadata.width && metadata.height 
    ? Number((metadata.width / metadata.height).toFixed(2))
    : 1;

  return {
    fullSize,
    thumbnail,
    aspectRatio,
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

export function generateR2Key(filename: string, type: 'full' | 'thumbnail'): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = 'webp';
  const prefix = type === 'full' ? 'photos' : 'thumbnails';
  return `${prefix}/${timestamp}-${randomString}.${extension}`;
} 