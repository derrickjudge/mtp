import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../.env.local') });

const r2Config = {
  bucketName: process.env.R2_BUCKET_NAME || '',
  publicUrl: process.env.R2_PUBLIC_URL || '',
  endpoint: process.env.R2_ENDPOINT || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
};

async function testR2Access() {
  try {
    console.log('Testing R2 configuration...');
    console.log('Bucket Name:', r2Config.bucketName);
    console.log('Public URL:', r2Config.publicUrl);
    console.log('Endpoint:', r2Config.endpoint);
    console.log('Access Key ID:', r2Config.accessKeyId ? '✓ Set' : '✗ Missing');
    console.log('Secret Access Key:', r2Config.secretAccessKey ? '✓ Set' : '✗ Missing');

    // Validate required configuration
    if (!r2Config.bucketName || !r2Config.publicUrl || !r2Config.endpoint || !r2Config.accessKeyId || !r2Config.secretAccessKey) {
      throw new Error('Missing required R2 configuration. Please check your .env.local file.');
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    });

    console.log('\nAttempting to list objects in bucket...');
    const command = new ListObjectsV2Command({
      Bucket: r2Config.bucketName,
      MaxKeys: 5, // Limit to 5 objects for testing
    });

    const response = await s3Client.send(command);
    console.log('\nSuccessfully connected to R2!');
    console.log('Found objects:', response.Contents?.length || 0);
    if (response.Contents?.length) {
      console.log('\nFirst few objects:');
      response.Contents.forEach((obj, index) => {
        console.log(`${index + 1}. ${obj.Key} (${obj.Size} bytes)`);
      });
    }
  } catch (error) {
    console.error('\nError testing R2 access:', error);
    process.exit(1);
  }
}

testR2Access(); 