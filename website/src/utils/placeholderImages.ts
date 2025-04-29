/**
 * Utility functions for generating placeholder images during development
 */

type ImageCategory = 'concert' | 'automotive' | 'nature' | 'abstract';

interface PlaceholderImageOptions {
  width?: number;
  height?: number;
  category?: ImageCategory;
  id?: string | number;
}

/**
 * Generate a placeholder image URL from Picsum Photos
 * This is a more reliable placeholder service for development
 */
export const getPlaceholderImage = ({
  width = 800,
  height = 600,
  id
}: PlaceholderImageOptions = {}): string => {
  // Image IDs in Picsum Photos are between 1-1000
  // If an ID is provided, use it, otherwise use a random value between 1-100
  const imageId = id ? (typeof id === 'number' ? id : hashStringToNumber(String(id), 1000)) : Math.floor(Math.random() * 100) + 1;
  
  // Return a URL from Picsum Photos
  return `https://picsum.photos/id/${imageId}/${width}/${height}`;
};

/**
 * Simple hash function to convert a string to a number between 1 and max
 */
const hashStringToNumber = (str: string, max: number = 1000): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  // Ensure the result is positive and between 1 and max
  return (Math.abs(hash) % max) + 1;
};

/**
 * Generate an array of placeholder images
 */
export const getPlaceholderImages = (
  count: number,
  width = 800,
  height = 600
): string[] => {
  return Array(count)
    .fill(0)
    .map((_, index) => 
      getPlaceholderImage({ width, height, id: index + 1 })
    );
};

export default {
  getPlaceholderImage,
  getPlaceholderImages
};
