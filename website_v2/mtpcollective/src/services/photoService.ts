import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Config } from '@/config/r2';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
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
  authorId: string;
  metadata?: Record<string, any>;
}

export type PhotoWithRelations = Prisma.PhotoGetPayload<{
  include: {
    categories: true;
    tags: true;
  };
}>;

export const photoService = {
  async uploadPhoto({
    file,
    fileName,
    contentType,
    title,
    description,
    categoryIds,
    tagIds,
    authorId,
    metadata,
  }: UploadPhotoParams): Promise<PhotoWithRelations> {
    // Generate unique file name
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const thumbnailFileName = `thumbnails/${uniqueFileName}`;

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

    // Create photo record in database
    const photo = await prisma.photo.create({
      data: {
        title,
        description,
        url: `${r2Config.publicUrl}/${uniqueFileName}`,
        thumbnail: `${r2Config.publicUrl}/${thumbnailFileName}`,
        categories: {
          connect: categoryIds.map(id => ({ id })),
        },
        tags: {
          connect: tagIds.map(id => ({ id })),
        },
        author: {
          connect: { id: authorId },
        },
        metadata,
      },
      include: {
        categories: true,
        tags: true,
      },
    });

    return photo;
  },

  async deletePhoto(id: string): Promise<void> {
    const photo = await prisma.photo.findUnique({
      where: { id },
    });

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
    await prisma.photo.delete({
      where: { id },
    });
  },

  async getPhotos(options?: {
    take?: number;
    skip?: number;
    categoryId?: string;
    tagId?: string;
    featured?: boolean;
  }): Promise<PhotoWithRelations[]> {
    return prisma.photo.findMany({
      where: {
        published: true,
        ...(options?.categoryId && {
          categories: {
            some: {
              id: options.categoryId,
            },
          },
        }),
        ...(options?.tagId && {
          tags: {
            some: {
              id: options.tagId,
            },
          },
        }),
        ...(options?.featured && {
          featured: true,
        }),
      },
      include: {
        categories: true,
        tags: true,
      },
      take: options?.take,
      skip: options?.skip,
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async getPhotoById(id: string): Promise<PhotoWithRelations | null> {
    return prisma.photo.findUnique({
      where: { id },
      include: {
        categories: true,
        tags: true,
      },
    });
  },
}; 