import { uploadPhoto, deletePhoto } from '@/services/photoService';

// Mock the R2 client
jest.mock('@/lib/r2Client', () => ({
  r2Client: {
    send: jest.fn(),
  },
  R2_BUCKET_NAME: 'test-bucket',
  R2_PUBLIC_URL: 'https://test-bucket.r2.dev',
  uploadToR2: jest.fn(),
  deleteFromR2: jest.fn(),
}));

// Import the mocked module to access the mock functions
import { uploadToR2, deleteFromR2 } from '@/lib/r2Client';

// Mock fetch API
global.fetch = jest.fn();

describe('Photo Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('uploadPhoto', () => {
    it('should upload a photo successfully', async () => {
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          thumbnail: 'data:image/jpeg;base64,abc123',
          width: 800,
          height: 600
        })
      });

      // Mock the fetch for the blob
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        blob: jest.fn().mockResolvedValueOnce(new Blob(['thumbnail-data'], { type: 'image/jpeg' }))
      });

      // Create a mock File object
      const mockFile = new File(['test-image'], 'test.jpg', { type: 'image/jpeg' });

      // Mock the R2 client responses
      (uploadToR2 as jest.Mock).mockImplementation((file, onProgress) => {
        if (file.name === 'test.jpg') {
          return Promise.resolve({
            url: 'https://test-bucket.r2.dev/photos/test.jpg',
            key: 'photos/test.jpg',
          });
        } else {
          return Promise.resolve({
            url: 'https://test-bucket.r2.dev/photos/thumb_test.jpg',
            key: 'photos/thumb_test.jpg',
          });
        }
      });

      const result = await uploadPhoto(mockFile);

      expect(global.fetch).toHaveBeenCalledWith('/api/photos/process', expect.any(Object));
      expect(uploadToR2).toHaveBeenCalledTimes(2);
      expect(result.url).toContain('test-bucket.r2.dev');
      expect(result.key).toContain('photos/');
      expect(result.thumbnailUrl).toBeDefined();
      expect(result.thumbnailKey).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should handle upload errors when processing fails', async () => {
      // Mock fetch to fail
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });

      // Create a mock File object
      const mockFile = new File(['test-image'], 'test.jpg', { type: 'image/jpeg' });

      const result = await uploadPhoto(mockFile);

      expect(result.error).toContain('Failed to process image');
      expect(result.url).toBe('');
      expect(result.key).toBe('');
    });
  });

  describe('deletePhoto', () => {
    it('should delete a photo successfully', async () => {
      const mockKey = 'photos/test.jpg';
      const mockThumbnailKey = 'photos/thumb_test.jpg';

      (deleteFromR2 as jest.Mock).mockResolvedValue({});

      const result = await deletePhoto(mockKey, mockThumbnailKey);

      expect(deleteFromR2).toHaveBeenCalledTimes(2);
      expect(deleteFromR2).toHaveBeenCalledWith(mockKey);
      expect(deleteFromR2).toHaveBeenCalledWith(mockThumbnailKey);
      expect(result.error).toBeUndefined();
    });

    it('should handle delete errors', async () => {
      const mockKey = 'photos/test.jpg';
      
      (deleteFromR2 as jest.Mock).mockRejectedValueOnce(new Error('Delete failed'));

      const result = await deletePhoto(mockKey);

      expect(result.error).toBe('Delete failed');
    });
  });
}); 