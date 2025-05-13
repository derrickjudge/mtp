import { getPlaceholderImage, getPlaceholderImages } from '../../utils/placeholderImages';

describe('Placeholder Image Utilities', () => {
  describe('getPlaceholderImage', () => {
    it('should generate a placeholder image URL with default values', () => {
      const url = getPlaceholderImage();
      
      // Check if URL has the correct format
      expect(url).toMatch(/^https:\/\/picsum\.photos\/id\/\d+\/800\/600$/);
    });
    
    it('should use provided dimensions', () => {
      const width = 500;
      const height = 300;
      const url = getPlaceholderImage({ width, height });
      
      // Check if URL contains the custom dimensions
      expect(url).toMatch(new RegExp(`^https:\\/\\/picsum\\.photos\\/id\\/\\d+\\/${width}\\/${height}$`));
    });
    
    it('should use consistent IDs for the same string ID input', () => {
      const id = 'test-id';
      const url1 = getPlaceholderImage({ id });
      const url2 = getPlaceholderImage({ id });
      
      // Same string ID should produce the same URL
      expect(url1).toEqual(url2);
    });
    
    it('should use numeric ID directly if provided', () => {
      const id = 42;
      const url = getPlaceholderImage({ id });
      
      // Check if URL contains the exact numeric ID
      expect(url).toMatch(new RegExp(`^https:\\/\\/picsum\\.photos\\/id\\/${id}\\/800\\/600$`));
    });
  });
  
  describe('getPlaceholderImages', () => {
    it('should generate the correct number of placeholder image URLs', () => {
      const count = 5;
      const images = getPlaceholderImages(count);
      
      // Check if array has correct length
      expect(images).toHaveLength(count);
      
      // Check if all URLs have the correct format
      images.forEach(url => {
        expect(url).toMatch(/^https:\/\/picsum\.photos\/id\/\d+\/800\/600$/);
      });
    });
    
    it('should use provided dimensions for all images', () => {
      const count = 3;
      const width = 400;
      const height = 300;
      const images = getPlaceholderImages(count, width, height);
      
      // Check dimensions in all URLs
      images.forEach(url => {
        expect(url).toMatch(new RegExp(`^https:\\/\\/picsum\\.photos\\/id\\/\\d+\\/${width}\\/${height}$`));
      });
    });
    
    it('should use sequential IDs for generated images', () => {
      const count = 3;
      const images = getPlaceholderImages(count);
      
      // Extract IDs from URLs
      const idRegex = /\/id\/(\d+)\//;
      const ids = images.map(url => {
        const match = url.match(idRegex);
        return match ? parseInt(match[1], 10) : null;
      });
      
      // Verify IDs are sequential
      expect(ids[1]).toEqual(ids[0] + 1);
      expect(ids[2]).toEqual(ids[1] + 1);
    });
  });
});
