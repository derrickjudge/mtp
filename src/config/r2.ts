export const r2Config = {
  bucketName: process.env.R2_BUCKET_NAME || '',
  publicUrl: process.env.R2_PUBLIC_URL || '',
  endpoint: process.env.R2_ENDPOINT || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
};

if (!r2Config.bucketName || !r2Config.publicUrl) {
  throw new Error('R2 configuration is missing. Please check your environment variables.');
} 