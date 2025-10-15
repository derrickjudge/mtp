'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PhotoCollage from '@/components/photos/PhotoCollage';
import PhotoLightbox from '@/components/photos/PhotoLightbox';
import type { Photo } from '@/types/photo';

// Make this page dynamic to prevent static generation issues
export const dynamic = 'force-dynamic';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

// Component to handle search params
function PortfolioContent() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const searchParams = useSearchParams();

  // Handle URL category parameter
  useEffect(() => {
    const categorySlug = searchParams?.get('category');
    if (categorySlug) {
      // Find category by slug and set it
      const category = categories.find(cat => cat.slug === categorySlug);
      if (category) {
        setSelectedCategory(category.id);
      }
    } else {
      // No category parameter means "All Photos" is selected
      setSelectedCategory('');
    }
  }, [searchParams, categories]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Fetch photos with optional category filter
  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/photos?published=true';
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // Extract photos array from response
        const photosArray = data.photos || [];
        
        // Respect curated ordering from the API (already ordered by DB)
        setPhotos(photosArray);
      } else {
        setError('Failed to load photos');
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Initialize data
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Get selected category info
  const selectedCategoryInfo = selectedCategory 
    ? categories.find(cat => cat.id === selectedCategory)
    : null;

  // Lightbox handlers
  const handlePhotoClick = (photo: Photo) => {
    const index = photos.findIndex(p => p.id === photo.id);
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  const handleLightboxPrevious = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const handleLightboxNext = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Section - Clean & Minimal */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          {selectedCategoryInfo ? (
            <>
              <nav className="text-sm text-gray-400 mb-6">
                <Link href="/portfolio" className="hover:text-white transition-colors">
                  Portfolio
                </Link>
                <span className="mx-2">→</span>
                <span className="text-white">{selectedCategoryInfo.name}</span>
              </nav>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-left">
                {selectedCategoryInfo.name}
              </h1>
              <p className="text-lg text-gray-300 max-w-3xl text-left">
                {selectedCategoryInfo.description || `Showcasing our ${selectedCategoryInfo.name.toLowerCase()} photography collection`}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-left">
                Portfolio
              </h1>
              <p className="text-lg text-gray-300 max-w-3xl text-left">
                Explore our photography collections showcasing the art of capturing moments across different genres.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Filter Section */}
      {categories.length > 0 && (
        <section className="py-6 bg-black border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <Link
                href="/portfolio"
                className={`
                  transition-all duration-300 uppercase tracking-wider
                  ${!selectedCategory 
                    ? 'text-white font-semibold border-b-2 border-white pb-1' 
                    : 'text-gray-400 hover:text-white'
                  }
                `}
              >
                All Photos
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/portfolio?category=${category.slug}`}
                  className={`
                    transition-all duration-300 uppercase tracking-wider
                    ${selectedCategory === category.id
                      ? 'text-white font-semibold border-b-2 border-white pb-1'
                      : 'text-gray-400 hover:text-white'
                    }
                  `}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-12 bg-black">
        {error ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">Error Loading Photos</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchPhotos}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading photos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">
              {selectedCategoryInfo ? 'No Photos in This Category' : 'No Photos Available'}
            </h3>
            <p className="text-gray-500 mb-4">
              {selectedCategoryInfo 
                ? `No photos found in the ${selectedCategoryInfo.name} category.`
                : 'No photos have been published yet. Check back soon!'
              }
            </p>
            {selectedCategoryInfo && (
              <Link
                href="/portfolio"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Photos
              </Link>
            )}
          </div>
        ) : (
          <PhotoCollage 
            photos={photos} 
            onPhotoClick={handlePhotoClick}
          />
        )}
      </section>

      {/* Lightbox */}
      {photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          currentPhotoIndex={currentPhotoIndex}
          isOpen={lightboxOpen}
          onClose={handleLightboxClose}
          onPrevious={handleLightboxPrevious}
          onNext={handleLightboxNext}
        />
      )}
    </div>
  );
}

// Main page component with Suspense wrapper
export default function PortfolioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading portfolio...</p>
        </div>
      </div>
    }>
      <PortfolioContent />
    </Suspense>
  );
}