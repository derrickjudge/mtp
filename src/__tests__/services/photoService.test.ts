import { photoService } from '@/services/photoService';

// Mock server-side S3 client and nativeDB used by photoService
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

jest.mock('@/lib/db-native', () => ({
  nativeDB: {
    createPhoto: jest.fn().mockResolvedValue({ id: '1' }),
    getPhotoWithRelations: jest.fn().mockResolvedValue({
      id: '1',
      title: 'Test',
      description: null,
      url: 'https://r2/public/photos/test.jpg',
      thumbnail: 'https://r2/public/thumbnails/test.jpg',
      published: true,
      featured: false,
      metadata: { width: 800, height: 600 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: 'admin',
      categories: [],
      tags: [],
      events: [],
    }),
    linkPhotoToCategories: jest.fn(),
    linkPhotoToTags: jest.fn(),
    linkPhotoToEvents: jest.fn(),
    findPhotoById: jest.fn().mockResolvedValue({
      id: '1',
      url: 'https://r2/public/photos/test.jpg',
      thumbnail: 'https://r2/public/thumbnails/test.jpg',
    }),
    deletePhoto: jest.fn(),
    findPhotos: jest.fn().mockResolvedValue([]),
    updatePhoto: jest.fn().mockResolvedValue({ id: '1' }),
    clearPhotoCategories: jest.fn(),
    clearPhotoTags: jest.fn(),
    clearPhotoEvents: jest.fn(),
  },
}));

describe('photoService (server-side)', () => {
  describe('uploadPhoto', () => {
    it('uploads image and creates DB record', async () => {
      // Provide a minimal valid PNG header buffer so sharp can parse
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      ]);
      const buffer = Buffer.concat([pngHeader, Buffer.alloc(100)]);
      const result = await photoService.uploadPhoto({
        file: buffer,
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        title: 'Test',
        description: 'Desc',
        categoryIds: [],
        tagIds: [],
        eventIds: [],
        authorId: 'admin',
        metadata: {},
      });

      expect(result.id).toBe('1');
      expect(result.url).toContain('photos');
      expect(result.thumbnail).toContain('thumbnails');
    });
  });

  describe('deletePhoto', () => {
    it('deletes assets from R2 and removes DB record', async () => {
      await expect(photoService.deletePhoto('1')).resolves.not.toThrow();
    });
  });
});