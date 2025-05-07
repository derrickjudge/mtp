'use client';

import React, { useState, useEffect } from 'react';
import PortfolioScreen from '../../components/PortfolioScreen';
import type { Photo } from '../../components/PortfolioScreen';

// Generate reliable sample photos with working URLs
const generateSamplePhotos = (): Photo[] => {
  // Categories to use
  const categories = ['Nature', 'Street', 'Portrait', 'Architecture', 'Concerts'];
  
  // Use these specific image IDs that are known to work well
  const imageIds = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
  
  const photos: Photo[] = [];
  
  // Create 15 sample photos (3 per category)
  for (let i = 0; i < 15; i++) {
    const category = categories[Math.floor(i / 3)];
    const imageId = imageIds[i];
    
    photos.push({
      id: `sample-${i+1}`,
      title: `${category} ${i % 3 + 1}`,
      description: `A sample ${category.toLowerCase()} photograph with direct URL`,
      category,
      imageUrl: `https://picsum.photos/id/${imageId}/800/600`,
      width: 800,
      height: 600
    });
  }
  
  return photos;
};

export default function PortfolioPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Load sample photos directly
  useEffect(() => {
    const samplePhotos = generateSamplePhotos();
    setPhotos(samplePhotos);
    setLoading(false);
  }, []);
  
  // Simple loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading portfolio...</p>
        </div>
      </div>
    );
  }
  
  return <PortfolioScreen photos={photos} />;
}
