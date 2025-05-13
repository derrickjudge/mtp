interface PlaceholderImageOptions {
  width: number;
  height: number;
  id: string;
}

export const getPlaceholderImage = ({ width, height, id }: PlaceholderImageOptions): string => {
  // Using Picsum Photos for high-quality placeholder images
  return `https://picsum.photos/seed/${id}/${width}/${height}`;
};

// Predefined placeholder images for consistent usage
export const placeholderImages = {
  hero: getPlaceholderImage({ width: 1920, height: 1080, id: 'hero' }),
  featured1: getPlaceholderImage({ width: 800, height: 600, id: 'featured1' }),
  featured2: getPlaceholderImage({ width: 800, height: 600, id: 'featured2' }),
  featured3: getPlaceholderImage({ width: 800, height: 600, id: 'featured3' }),
  concert: getPlaceholderImage({ width: 800, height: 600, id: 'concert' }),
  automotive: getPlaceholderImage({ width: 800, height: 600, id: 'automotive' }),
  nature: getPlaceholderImage({ width: 800, height: 600, id: 'nature' }),
}; 