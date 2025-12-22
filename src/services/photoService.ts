import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Config } from '@/config/r2';
import { nativeDB } from '@/lib/db-native';
import { Category, Tag, Photo } from '@/types/photo';
import sharp from 'sharp';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: r2Config.endpoint,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
});

export interface UploadPhotoParams {
  file: Buffer;
  fileName: string;
  contentType: string;
  title: string;
  description?: string;
  categoryIds: string[];
  tagIds: string[];
  eventIds: string[];
  authorId: string;
  metadata?: Record<string, any>;
}

export type PhotoWithRelations = Photo & {
  categories: Category[];
  tags: Tag[];
  events: Event[];
};

interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
  date?: string;
  location?: string;
}

// Helper function to convert native DB result to Photo type
const convertNativeToPhoto = (nativePhoto: any): PhotoWithRelations => ({
  id: nativePhoto.id,
  title: nativePhoto.title,
  description: nativePhoto.description || undefined,
  url: nativePhoto.url,
  thumbnail: nativePhoto.thumbnail || undefined,
  published: nativePhoto.published,
  featured: nativePhoto.featured,
  metadata: nativePhoto.metadata ? (typeof nativePhoto.metadata === 'string' ? JSON.parse(nativePhoto.metadata) : nativePhoto.metadata) : undefined,
  createdAt: nativePhoto.createdAt instanceof Date ? nativePhoto.createdAt.toISOString() : nativePhoto.createdAt,
  updatedAt: nativePhoto.updatedAt instanceof Date ? nativePhoto.updatedAt.toISOString() : nativePhoto.updatedAt,
  authorId: nativePhoto.authorId,
  categories: nativePhoto.categories ? (Array.isArray(nativePhoto.categories) ? nativePhoto.categories : JSON.parse(nativePhoto.categories)) : [],
  tags: nativePhoto.tags ? (Array.isArray(nativePhoto.tags) ? nativePhoto.tags : JSON.parse(nativePhoto.tags)) : [],
  events: nativePhoto.events ? (Array.isArray(nativePhoto.events) ? nativePhoto.events : JSON.parse(nativePhoto.events)) : [],
});

export const photoService = {
  async uploadPhoto({
    file,
    fileName,
    contentType,
    title,
    description,
    categoryIds,
    tagIds,
    eventIds,
    authorId,
    metadata,
  }: UploadPhotoParams): Promise<PhotoWithRelations> {
    // Generate unique file name
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const thumbnailFileName = `thumbnails/${uniqueFileName}`;

    // Extract original image dimensions for proper aspect ratio
    const imageInfo = await sharp(file).metadata();
    const originalWidth = imageInfo.width || 1200;
    const originalHeight = imageInfo.height || 800;
    const aspectRatio = originalWidth / originalHeight;

    // Process image and create thumbnail
    const processedImage = await sharp(file)
      .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    const thumbnail = await sharp(file)
      .resize(300, 200, { fit: 'cover' })
      .toBuffer();

    // Upload original image
    await s3Client.send(
      new PutObjectCommand({
        Bucket: r2Config.bucketName,
        Key: uniqueFileName,
        Body: processedImage,
        ContentType: contentType,
      })
    );

    // Upload thumbnail
    await s3Client.send(
      new PutObjectCommand({
        Bucket: r2Config.bucketName,
        Key: thumbnailFileName,
        Body: thumbnail,
        ContentType: contentType,
      })
    );

    // Create photo record in database using native client
    const photo = await nativeDB.createPhoto({
      title,
      description,
      url: `${r2Config.publicUrl}/${uniqueFileName}`,
      thumbnail: `${r2Config.publicUrl}/${thumbnailFileName}`,
      authorId,
      metadata: {
        ...metadata,
        width: originalWidth,
        height: originalHeight,
        aspectRatio: aspectRatio,
        originalDimensions: `${originalWidth}x${originalHeight}`,
      },
    });

    if (!photo) {
      throw new Error('Failed to create photo record');
    }

    // Link photo to categories, tags, and events
    if (categoryIds.length > 0) {
      await nativeDB.linkPhotoToCategories(photo.id, categoryIds);
    }

    if (tagIds.length > 0) {
      await nativeDB.linkPhotoToTags(photo.id, tagIds);
    }

    if (eventIds.length > 0) {
      await nativeDB.linkPhotoToEvents(photo.id, eventIds);
    }

    // Get the photo with its relations
    const photoWithRelations = await nativeDB.getPhotoWithRelations(photo.id);
    
    if (!photoWithRelations) {
      throw new Error('Failed to retrieve photo with relations');
    }

    return convertNativeToPhoto(photoWithRelations);
  },

  async deletePhoto(id: string): Promise<void> {
    const photo = await nativeDB.findPhotoById(id);

    if (!photo) {
      throw new Error('Photo not found');
    }

    // Extract file names from URLs
    const fileName = photo.url.split('/').pop();
    const thumbnailFileName = photo.thumbnail?.split('/').pop();

    // Delete from R2
    if (fileName) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: r2Config.bucketName,
          Key: fileName,
        })
      );
    }

    if (thumbnailFileName) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: r2Config.bucketName,
          Key: thumbnailFileName,
        })
      );
    }

    // Delete from database
    await nativeDB.deletePhoto(id);
  },

  async getPhotos(options?: {
    take?: number;
    skip?: number;
    categoryId?: string;
    tagId?: string;
    eventId?: string;
    featured?: boolean;
    published?: boolean;
  }): Promise<PhotoWithRelations[]> {
    const photos = await nativeDB.findPhotos(options);

    // For each photo, we need to get its relations
    const photosWithRelations = await Promise.all(
      photos.map(async (photo) => {
        const photoWithRelations = await nativeDB.getPhotoWithRelations(photo.id);
        return photoWithRelations ? convertNativeToPhoto(photoWithRelations) : null;
      })
    );

    return photosWithRelations.filter(Boolean) as PhotoWithRelations[];
  },

  async getPhotoById(id: string): Promise<PhotoWithRelations | null> {
    const photo = await nativeDB.getPhotoWithRelations(id);
    return photo ? convertNativeToPhoto(photo) : null;
  },

  async updatePhoto(id: string, data: {
    title: string;
    description?: string;
    categoryIds: string[];
    tagIds: string[];
    eventIds: string[];
    published?: boolean;
    featured?: boolean;
  }): Promise<PhotoWithRelations> {
    console.log('[photoService.updatePhoto] Starting update for photo:', id);
    console.log('[photoService.updatePhoto] Category IDs to set:', data.categoryIds);
    
    // First, check if photo exists
    const existingPhoto = await nativeDB.findPhotoById(id);
    if (!existingPhoto) {
      throw new Error('Photo not found');
    }
    console.log('[photoService.updatePhoto] Found existing photo:', existingPhoto.title);

    // Update the photo record
    const updatedPhoto = await nativeDB.updatePhoto(id, {
      title: data.title,
      description: data.description,
      published: data.published ?? true,
      featured: data.featured ?? false,
    });

    if (!updatedPhoto) {
      throw new Error('Failed to update photo');
    }
    console.log('[photoService.updatePhoto] Photo record updated');

    // Update category relationships
    console.log('[photoService.updatePhoto] Clearing existing category links...');
    await nativeDB.clearPhotoCategories(id);
    console.log('[photoService.updatePhoto] Cleared. Now linking to categories:', data.categoryIds);
    if (data.categoryIds.length > 0) {
      await nativeDB.linkPhotoToCategories(id, data.categoryIds);
      console.log('[photoService.updatePhoto] Linked to', data.categoryIds.length, 'categories');
    }

    // Update tag relationships
    await nativeDB.clearPhotoTags(id);
    if (data.tagIds.length > 0) {
      await nativeDB.linkPhotoToTags(id, data.tagIds);
    }

    // Update event relationships
    await nativeDB.clearPhotoEvents(id);
    if (data.eventIds.length > 0) {
      await nativeDB.linkPhotoToEvents(id, data.eventIds);
    }

    // Get the updated photo with relations
    const photoWithRelations = await nativeDB.getPhotoWithRelations(id);
    console.log('[photoService.updatePhoto] Retrieved updated photo, categories:', 
      photoWithRelations?.categories?.map((c: {name: string}) => c.name));
    
    if (!photoWithRelations) {
      throw new Error('Failed to retrieve updated photo');
    }

    return convertNativeToPhoto(photoWithRelations);
  },
}; 