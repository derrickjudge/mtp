'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Image } from '@/components/common/Image';
import { imageUrls } from '@/utils/imageUrls';
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
        url += `&categoryId=${selectedCategory}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // Sort photos: featured first, then by creation date
        const sortedPhotos = data.sort((a: Photo, b: Photo) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setPhotos(sortedPhotos);
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
      {/* Hero Section */}
      <section className="relative w-full" style={{ height: '50vh' }}>
        <div className="absolute inset-0">
          <Image
            src={imageUrls.portfolio}
            alt="MTP Collective Portfolio"
            fill
            priority
            sizes="100vw"
            className="object-cover brightness-75"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30 flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-4">
            {selectedCategoryInfo ? (
              <>
                <nav className="text-sm text-gray-300 mb-4">
                  <Link href="/portfolio" className="hover:text-white transition-colors">
                    Portfolio
                  </Link>
                  <span className="mx-2">→</span>
                  <span className="text-white">{selectedCategoryInfo.name}</span>
                </nav>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                  {selectedCategoryInfo.name}
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 font-light max-w-2xl mx-auto">
                  {selectedCategoryInfo.description || `Showcasing our ${selectedCategoryInfo.name.toLowerCase()} photography collection`}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                  Portfolio
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 font-light max-w-2xl mx-auto">
                  Explore our photography collections showcasing the art of capturing moments across different genres.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Filter Section */}
      {categories.length > 0 && (
        <section className="py-8 bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/portfolio"
                className={`
                  px-4 py-2 rounded-full transition-all duration-300
                  ${!selectedCategory 
                    ? 'bg-white text-black font-medium' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
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
                    px-4 py-2 rounded-full transition-all duration-300
                    ${selectedCategory === category.id
                      ? 'bg-white text-black font-medium'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
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

      {/* Photo Count and Sort Info */}
      {!loading && photos.length > 0 && (
        <section className="py-4 bg-black">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>
                {photos.length} photo{photos.length !== 1 ? 's' : ''} 
                {selectedCategoryInfo && ` in ${selectedCategoryInfo.name}`}
              </span>
              <span className="hidden md:block">
                Featured photos are highlighted • Click any photo to view full size
              </span>
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