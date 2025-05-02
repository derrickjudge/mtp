'use client';

import React, { useState, useEffect } from 'react';
import PortfolioScreen from '../../components/PortfolioScreen';
import type { Photo } from '../../components/PortfolioScreen';
import { getPhotos, getCategories } from '../../services/photoService';
import { getPlaceholderImage } from '../../utils/placeholderImages';

// Fallback categories if API call fails
const defaultCategories = ['All', 'Concerts', 'Sports', 'Street', 'Nature', 'Automotive'];

// Generate fallback photos if the API fails
const generateFallbackPhotos = (): Photo[] => {
  const samplePhotos: Photo[] = [];
  
  // List of reliable image IDs from picsum.photos
  const reliableImageIds = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50
  ];
  
  // Generate 5 photos for each category (25 total)
  defaultCategories.slice(1).forEach((category, categoryIndex) => {
    for (let i = 1; i <= 5; i++) {
      const id = `${category.toLowerCase()}-${i}`;
      
      // Use predictable IDs for each category to ensure consistent images
      const imageIndex = (categoryIndex * 5 + i - 1) % reliableImageIds.length;
      const imageId = reliableImageIds[imageIndex];
      
      // Use direct picsum.photos URL with known reliable IDs
      const imageUrl = `https://picsum.photos/id/${imageId}/1200/800`;
      
      samplePhotos.push({
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
  
  return samplePhotos;
};

export default function PortfolioPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch photos from the database
  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use the photo service to fetch from the API
        const result = await getPhotos('All', 1, 50); // Get up to 50 photos
        
        if (result.success && result.data) {
          setPhotos(result.data.photos);
        } else {
          console.warn('Using fallback data due to API error:', result.error);
          // Use fallback data if the API call fails
          setPhotos(generateFallbackPhotos());
          setError('Could not load photos from the database. Using sample data instead.');
        }
      } catch (err) {
        console.error('Error fetching photos:', err);
        setPhotos(generateFallbackPhotos());
        setError('An error occurred while loading photos. Using sample data instead.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPhotos();
  }, []);
  
  // Simple loading state
  if (loading && photos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading portfolio...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {error && (
        <div className="bg-yellow-800 text-white px-4 py-2 text-sm text-center">
          {error}
        </div>
      )}
      <PortfolioScreen photos={photos} />
    </>
  );
}
