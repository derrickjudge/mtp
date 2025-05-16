import { uploadPhoto, deletePhoto } from '@/services/photoService';
import { r2Client } from '@/lib/r2Client';

// Mock the R2 client
jest.mock('@/lib/r2Client', () => ({
  r2Client: {
    send: jest.fn(),
  },
  R2_BUCKET_NAME: 'test-bucket',
  R2_PUBLIC_URL: 'https://test-bucket.r2.dev',
}));

describe('Photo Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadPhoto', () => {
    it('should upload a photo successfully', async () => {
      // Create a mock File object with arrayBuffer method
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = {
        name: 'test.jpg',
        type: 'image/jpeg',
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      } as unknown as File;

      (r2Client.send as jest.Mock).mockResolvedValueOnce({});

      const result = await uploadPhoto(mockFile);

      expect(r2Client.send).toHaveBeenCalledWith(expect.any(Object));
      expect(result.url).toContain('test-bucket.r2.dev');
      expect(result.key).toContain('photos/');
      expect(result.error).toBeUndefined();
    });

    it('should handle upload errors', async () => {
      // Create a mock File object with arrayBuffer method
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = {
        name: 'test.jpg',
        type: 'image/jpeg',
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      } as unknown as File;

      const mockError = new Error('Upload failed');
      (r2Client.send as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await uploadPhoto(mockFile);

      expect(result.error).toBe('Upload failed');
      expect(result.url).toBe('');
      expect(result.key).toBe('');
    });
  });

  describe('deletePhoto', () => {
    it('should delete a photo successfully', async () => {
      const mockKey = 'photos/test.jpg';

      (r2Client.send as jest.Mock).mockResolvedValueOnce({});

      const result = await deletePhoto(mockKey);

      expect(r2Client.send).toHaveBeenCalledWith(expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle delete errors', async () => {
      const mockKey = 'photos/test.jpg';
      const mockError = new Error('Delete failed');

      (r2Client.send as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await deletePhoto(mockKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });
}); 