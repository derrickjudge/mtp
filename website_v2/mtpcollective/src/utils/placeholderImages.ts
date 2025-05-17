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
  about: getPlaceholderImage({ width: 1920, height: 1080, id: 'about' }),
  contact: getPlaceholderImage({ width: 1920, height: 1080, id: 'contact' }),
  portfolio: getPlaceholderImage({ width: 1920, height: 1080, id: 'portfolio' }),
  services: getPlaceholderImage({ width: 1920, height: 1080, id: 'services' }),
  featured1: getPlaceholderImage({ width: 800, height: 600, id: 'featured1' }),
  featured2: getPlaceholderImage({ width: 800, height: 600, id: 'featured2' }),
  featured3: getPlaceholderImage({ width: 800, height: 600, id: 'featured3' }),
  concert: getPlaceholderImage({ width: 800, height: 600, id: 'mtp-concert' }),
  automotive: getPlaceholderImage({ width: 800, height: 600, id: 'mtp-automotive' }),
  nature: getPlaceholderImage({ width: 800, height: 600, id: 'mtp-nature' }),
  team1: getPlaceholderImage({ width: 400, height: 600, id: 'team1' }),
  team2: getPlaceholderImage({ width: 400, height: 600, id: 'team2' }),
  team3: getPlaceholderImage({ width: 400, height: 600, id: 'team3' }),
  // Portfolio images
  concertPhoto1: getPlaceholderImage({ width: 800, height: 600, id: 'concert-1' }),
  concertPhoto2: getPlaceholderImage({ width: 800, height: 600, id: 'concert-2' }),
  concertPhoto3: getPlaceholderImage({ width: 800, height: 600, id: 'concert-3' }),
  autoPhoto1: getPlaceholderImage({ width: 800, height: 600, id: 'auto-1' }),
  autoPhoto2: getPlaceholderImage({ width: 800, height: 600, id: 'auto-2' }),
  autoPhoto3: getPlaceholderImage({ width: 800, height: 600, id: 'auto-3' }),
  naturePhoto1: getPlaceholderImage({ width: 800, height: 600, id: 'nature-1' }),
  naturePhoto2: getPlaceholderImage({ width: 800, height: 600, id: 'nature-2' }),
  naturePhoto3: getPlaceholderImage({ width: 800, height: 600, id: 'nature-3' }),
}; 