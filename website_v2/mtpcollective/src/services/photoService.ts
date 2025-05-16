import { uploadToR2, deleteFromR2 } from '@/lib/r2Client';

export interface UploadResult {
  url: string;
  key: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  width?: number;
  height?: number;
  error?: string;
}

export async function uploadPhoto(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    // Process image on the server
    const formData = new FormData();
    formData.append('file', file);

    const processResponse = await fetch('/api/photos/process', {
      method: 'POST',
      body: formData,
    });

    if (!processResponse.ok) {
      throw new Error('Failed to process image');
    }

    const { thumbnail, width, height } = await processResponse.json();

    // Upload original image
    const result = await uploadToR2(file, onProgress);
    if (result.error) {
      throw new Error(result.error);
    }

    // Convert base64 thumbnail to File
    const thumbnailBlob = await fetch(thumbnail).then(r => r.blob());
    const thumbnailFile = new File([thumbnailBlob], `thumb_${file.name}`, {
      type: 'image/jpeg',
    });

    // Upload thumbnail
    const thumbnailResult = await uploadToR2(thumbnailFile);

    return {
      url: result.url,
      key: result.key,
      thumbnailUrl: thumbnailResult.url,
      thumbnailKey: thumbnailResult.key,
      width,
      height,
    };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return {
      url: '',
      key: '',
      error: error instanceof Error ? error.message : 'Failed to upload photo',
    };
  }
}

export async function deletePhoto(key: string, thumbnailKey?: string): Promise<{ error?: string }> {
  try {
    await deleteFromR2(key);
    if (thumbnailKey) {
      await deleteFromR2(thumbnailKey);
    }
    return {};
  } catch (error) {
    console.error('Error deleting photo:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to delete photo',
    };
  }
} 