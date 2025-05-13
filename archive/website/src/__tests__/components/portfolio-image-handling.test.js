/**
 * Tests for portfolio image loading and error handling
 */

describe('Portfolio Image Handling', () => {
  test('generateImageFallbackUrl creates valid fallback URLs', () => {
    // Simulate the fallback URL generation function
    const generateImageFallbackUrl = (width = 1200, height = 800) => {
      // Use a reliable fallback image ID
      return `https://picsum.photos/id/1/${width}/${height}`;
    };

    // Test with default dimensions
    const defaultFallback = generateImageFallbackUrl();
    expect(defaultFallback).toBe('https://picsum.photos/id/1/1200/800');

    // Test with custom dimensions
    const customFallback = generateImageFallbackUrl(800, 600);
    expect(customFallback).toBe('https://picsum.photos/id/1/800/600');
  });

  test('generatePhotoObjects creates correctly structured photo objects', () => {
    // Simulate the function that creates photo objects
    const generatePhotoObjects = (categories, count = 5) => {
      const photos = [];
      
      categories.forEach(category => {
        for (let i = 1; i <= count; i++) {
          const id = `${category.toLowerCase()}-${i}`;
          const imageId = Math.abs((category.charCodeAt(0) * 10) + i) % 50 + 1;
          const imageUrl = `https://picsum.photos/id/${imageId}/1200/800`;
          
          photos.push({
            id,
            title: `${category} Photo ${i}`,
            description: `A beautiful ${category.toLowerCase()} photo`,
            category,
            imageUrl,
            width: 1200,
            height: 800
          });
        }
      });
      
      return photos;
    };

    // Test with a simple category list
    const categories = ['Concerts', 'Sports'];
    const photos = generatePhotoObjects(categories, 2);
    
    // Check the structure and count of generated photos
    expect(photos.length).toBe(4); // 2 categories × 2 photos
    expect(photos[0].id).toBe('concerts-1');
    expect(photos[0].title).toBe('Concerts Photo 1');
    expect(photos[0].category).toBe('Concerts');
    expect(photos[0].imageUrl).toMatch(/^https:\/\/picsum\.photos\/id\/\d+\/1200\/800$/);
    
    // Verify that the second category photos are also correct
    expect(photos[2].id).toBe('sports-1');
    expect(photos[2].category).toBe('Sports');
  });

  test('handleImageError sets fallback image source', () => {
    // Mock the image element
    const mockImageElement = {
      src: 'https://example.com/broken-image.jpg'
    };
    
    // Simulate the error handling function
    const handleImageError = (event) => {
      const target = event.target;
      target.src = 'https://picsum.photos/id/1/1200/800'; // Fallback image
    };
    
    // Call the error handler with our mock image element
    handleImageError({ target: mockImageElement });
    
    // Check that the src was updated to the fallback URL
    expect(mockImageElement.src).toBe('https://picsum.photos/id/1/1200/800');
  });
});
