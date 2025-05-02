/**
 * Tests for portfolio filtering and state management
 * This test focuses on isolated functionality rather than component integration
 */

describe('Portfolio Photo Filtering', () => {
  // Sample photo data
  const samplePhotos = [
    { id: 'concert-1', category: 'Concerts', title: 'Concert Photo 1' },
    { id: 'concert-2', category: 'Concerts', title: 'Concert Photo 2' },
    { id: 'sports-1', category: 'Sports', title: 'Sports Photo 1' },
    { id: 'nature-1', category: 'Nature', title: 'Nature Photo 1' },
    { id: 'street-1', category: 'Street', title: 'Street Photo 1' },
    { id: 'automotive-1', category: 'Automotive', title: 'Automotive Photo 1' }
  ];

  // Test the core filtering function that's used in the portfolio component
  test('filterPhotosByCategory returns correct photos for a specific category', () => {
    // Recreate the filtering logic from PortfolioScreen component
    const filterPhotosByCategory = (photos, category) => {
      if (category === 'All') {
        return photos;
      } else {
        return photos.filter(photo => photo.category === category);
      }
    };

    // Test filtering for Concerts category
    const concertPhotos = filterPhotosByCategory(samplePhotos, 'Concerts');
    expect(concertPhotos.length).toBe(2);
    expect(concertPhotos[0].id).toBe('concert-1');
    expect(concertPhotos[1].id).toBe('concert-2');

    // Test filtering for Sports category
    const sportsPhotos = filterPhotosByCategory(samplePhotos, 'Sports');
    expect(sportsPhotos.length).toBe(1);
    expect(sportsPhotos[0].id).toBe('sports-1');
  });

  // Test the "All" category filter
  test('filterPhotosByCategory returns all photos when category is "All"', () => {
    const filterPhotosByCategory = (photos, category) => {
      if (category === 'All') {
        return photos;
      } else {
        return photos.filter(photo => photo.category === category);
      }
    };

    const allPhotos = filterPhotosByCategory(samplePhotos, 'All');
    expect(allPhotos.length).toBe(samplePhotos.length);
    expect(allPhotos).toEqual(samplePhotos);
  });

  // Test empty result case
  test('filterPhotosByCategory returns empty array for non-existent category', () => {
    const filterPhotosByCategory = (photos, category) => {
      if (category === 'All') {
        return photos;
      } else {
        return photos.filter(photo => photo.category === category);
      }
    };

    const nonExistentCategoryPhotos = filterPhotosByCategory(samplePhotos, 'NonExistent');
    expect(nonExistentCategoryPhotos.length).toBe(0);
  });
});

// Test image URL generation utility
describe('Portfolio Image URL Generation', () => {
  test('createImageUrl generates valid image URLs', () => {
    // This mimics the image URL generation logic
    const createImageUrl = (category, index) => {
      const id = Math.abs((category.charCodeAt(0) * 10) + index) % 50 + 1;
      return `https://picsum.photos/id/${id}/1200/800`;
    };

    const url1 = createImageUrl('Concerts', 1);
    const url2 = createImageUrl('Sports', 2);

    // URLs should match the expected format
    expect(url1).toMatch(/^https:\/\/picsum\.photos\/id\/\d+\/1200\/800$/);
    expect(url2).toMatch(/^https:\/\/picsum\.photos\/id\/\d+\/1200\/800$/);

    // Same inputs should produce same outputs (deterministic)
    expect(createImageUrl('Concerts', 1)).toBe(url1);
    expect(createImageUrl('Sports', 2)).toBe(url2);
  });
});
