'use client';

import React from 'react';
import Link from 'next/link';
import PhotoCard from './PhotoCard';
import { getPlaceholderImage } from '../utils/placeholderImages';

// Sample data using placeholder images
const samplePhotos = [
  {
    id: 'photo1',
    imageUrl: getPlaceholderImage({ width: 600, height: 800, id: 'photo1' }),
    title: 'Concert Lights',
    category: 'Concerts',
    aspectRatio: 'portrait' as const,
  },
  {
    id: 'photo2',
    imageUrl: getPlaceholderImage({ width: 800, height: 600, id: 'photo2' }),
    title: 'Classic Mustang',
    category: 'Automotive',
    aspectRatio: 'landscape' as const,
  },
  {
    id: 'photo3',
    imageUrl: getPlaceholderImage({ width: 800, height: 600, id: 'photo3' }),
    title: 'Mountain Sunrise',
    category: 'Nature',
    aspectRatio: 'landscape' as const,
  },
  {
    id: 'photo4',
    imageUrl: getPlaceholderImage({ width: 800, height: 800, id: 'photo4' }),
    title: 'Festival Stage',
    category: 'Concerts',
    aspectRatio: 'square' as const,
  },
  {
    id: 'photo5',
    imageUrl: getPlaceholderImage({ width: 600, height: 800, id: 'photo5' }),
    title: 'Vintage Porsche',
    category: 'Automotive',
    aspectRatio: 'portrait' as const,
  },
  {
    id: 'photo6',
    imageUrl: getPlaceholderImage({ width: 800, height: 800, id: 'photo6' }),
    title: 'Forest Path',
    category: 'Nature',
    aspectRatio: 'square' as const,
  },
];

interface FeaturedPhotosProps {
  title?: string;
  viewAllLink?: string;
  limit?: number;
}

const FeaturedPhotos: React.FC<FeaturedPhotosProps> = ({
  title = 'Featured Work',
  viewAllLink = '/portfolio',
  limit = 6,
}) => {
  // Limit the number of photos to display
  const displayPhotos = samplePhotos.slice(0, limit);

  return (
    <section className="py-16 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          {viewAllLink && (
            <Link 
              href={viewAllLink}
              className="text-sm font-semibold px-4 py-2 border border-white/30 rounded-md hover:bg-white/10 transition-colors"
            >
              View All
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPhotos.map((photo) => (
            <PhotoCard 
              key={photo.id}
              id={photo.id}
              imageUrl={photo.imageUrl}
              title={photo.title}
              category={photo.category}
              aspectRatio={photo.aspectRatio}
              priority={samplePhotos.indexOf(photo) < 3} // Prioritize loading first 3 images
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedPhotos;
