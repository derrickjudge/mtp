import AWS from 'aws-sdk';

// Initialize S3 client with environment variables
const S3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'mtp-collective-photos';

/**
 * Upload a file to S3
 * @param file - The file buffer to upload
 * @param key - The S3 object key (path/filename.ext)
 * @param contentType - MIME type of the file
 * @returns Promise with S3 upload response
 */
export const uploadToS3 = async (
  file: Buffer,
  key: string,
  contentType: string
): Promise<AWS.S3.ManagedUpload.SendData> => {
  const params: AWS.S3.PutObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read',
  };

  return new Promise((resolve, reject) => {
    S3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Delete a file from S3
 * @param key - The S3 object key to delete
 * @returns Promise with S3 delete response
 */
export const deleteFromS3 = async (key: string): Promise<AWS.S3.DeleteObjectOutput> => {
  const params: AWS.S3.DeleteObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  return new Promise((resolve, reject) => {
    S3.deleteObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Generate a signed URL for temporary access to a private S3 object
 * @param key - The S3 object key
 * @param expiresIn - Expiration time in seconds (default: 60 seconds)
 * @returns Signed URL string
 */
export const getSignedUrl = (key: string, expiresIn: number = 60): string => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn,
  };

  return S3.getSignedUrl('getObject', params);
};

export default {
  uploadToS3,
  deleteFromS3,
  getSignedUrl,
};
