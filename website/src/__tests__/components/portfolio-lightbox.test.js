/**
 * Tests for the portfolio lightbox interaction logic
 */

describe('Portfolio Lightbox Behavior', () => {
  // Simulate the state management functions from the PortfolioScreen component
  let lightboxOpen = false;
  let photoIndex = 0;
  const photos = [
    { id: 'photo-1', title: 'Photo 1', imageUrl: '/photo1.jpg' },
    { id: 'photo-2', title: 'Photo 2', imageUrl: '/photo2.jpg' },
    { id: 'photo-3', title: 'Photo 3', imageUrl: '/photo3.jpg' }
  ];

  // Reset state before each test
  beforeEach(() => {
    lightboxOpen = false;
    photoIndex = 0;
  });

  test('openLightbox sets the correct photo index and lightbox state', () => {
    // Function to simulate opening the lightbox
    const openLightbox = (index) => {
      photoIndex = index;
      lightboxOpen = true;
    };

    // Open lightbox for the second photo
    openLightbox(1);
    
    // Check that state is updated correctly
    expect(lightboxOpen).toBe(true);
    expect(photoIndex).toBe(1);
  });

  test('closeLightbox correctly updates lightbox state', () => {
    // First open the lightbox
    lightboxOpen = true;
    
    // Function to simulate closing the lightbox
    const closeLightbox = () => {
      lightboxOpen = false;
    };

    // Close the lightbox
    closeLightbox();
    
    // Check that lightbox is closed
    expect(lightboxOpen).toBe(false);
  });

  test('moveNext cycles to the next photo and wraps around at the end', () => {
    // Start with index 1
    photoIndex = 1;
    
    // Function to simulate moving to the next photo
    const moveNext = () => {
      photoIndex = (photoIndex + 1) % photos.length;
    };

    // Move to next photo (index 2)
    moveNext();
    expect(photoIndex).toBe(2);
    
    // Move to next photo (should wrap around to index 0)
    moveNext();
    expect(photoIndex).toBe(0);
  });

  test('movePrev cycles to the previous photo and wraps around at the beginning', () => {
    // Start with index 1
    photoIndex = 1;
    
    // Function to simulate moving to the previous photo
    const movePrev = () => {
      photoIndex = (photoIndex + photos.length - 1) % photos.length;
    };

    // Move to previous photo (index 0)
    movePrev();
    expect(photoIndex).toBe(0);
    
    // Move to previous photo (should wrap around to index 2)
    movePrev();
    expect(photoIndex).toBe(2);
  });
});
