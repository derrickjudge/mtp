import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Config } from '@/config/r2';

// SECURITY FIX: Removed debug logging that exposed environment variables
// Only log non-sensitive configuration validation

const { R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;

if (!R2_BUCKET_NAME || !R2_PUBLIC_URL) {
  throw new Error('R2 configuration is missing. Please check your environment variables.');
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: r2Config.endpoint,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
});

export interface UploadResult {
  url: string;
  key: string;
  error?: string;
}

export async function uploadToR2(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    const timestamp = Date.now();
    const key = `photos/${timestamp}-${file.name}`;

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: uint8Array,
        ContentType: file.type,
      })
    );

    return {
      url: `${R2_PUBLIC_URL}/${key}`,
      key,
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return {
      url: '',
      key: '',
      error: error instanceof Error ? error.message : 'Failed to upload to R2',
    };
  }
}

export async function deleteFromR2(key: string): Promise<{ error?: string }> {
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return {};
  } catch (error) {
    console.error('Error deleting from R2:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to delete from R2',
    };
  }
} 