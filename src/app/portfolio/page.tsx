'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
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
  description?: string;
  parentId?: string | null;
  children?: Category[];
}

// Component to handle search params
function PortfolioContent() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]); // Flat list
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const searchParams = useSearchParams();

  // Handle URL category parameter
  useEffect(() => {
    const categorySlug = searchParams?.get('category') || '';
    setSelectedCategorySlug(categorySlug);
  }, [searchParams]);

  // Fetch categories with hierarchy
  const fetchCategories = useCallback(async () => {
    try {
      // Fetch hierarchy for navigation
      const response = await fetch('/api/categories?hierarchy=true');
      if (response.ok) {
        const data: Category[] = await response.json();
        setCategories(data);
        
        // Create flat list for lookups
        const flat: Category[] = [];
        data.forEach(parent => {
          flat.push(parent);
          if (parent.children) {
            parent.children.forEach(child => flat.push(child));
          }
        });
        setAllCategories(flat);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Find selected category info
  const selectedCategory = useMemo(() => {
    if (!selectedCategorySlug) return null;
    return allCategories.find(cat => cat.slug === selectedCategorySlug) || null;
  }, [selectedCategorySlug, allCategories]);

  // Find parent category if selected is a subcategory
  const parentCategory = useMemo(() => {
    if (!selectedCategory?.parentId) return null;
    return allCategories.find(cat => cat.id === selectedCategory.parentId) || null;
  }, [selectedCategory, allCategories]);

  // Get subcategories of selected parent (or parent of selected subcategory)
  const activeParent = useMemo(() => {
    if (!selectedCategory) return null;
    if (selectedCategory.parentId) {
      // Selected is a subcategory, find its parent
      return categories.find(cat => cat.id === selectedCategory.parentId) || null;
    }
    // Selected is a parent
    return categories.find(cat => cat.id === selectedCategory.id) || null;
  }, [selectedCategory, categories]);

  // Fetch photos with optional category filter
  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/photos?published=true';
      if (selectedCategory) {
        url += `&category=${selectedCategory.id}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const photosArray = data.photos || [];
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
    if (allCategories.length > 0 || !selectedCategorySlug) {
      fetchPhotos();
    }
  }, [fetchPhotos, allCategories.length, selectedCategorySlug]);

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

  // Get display name (remove parent prefix from Signature Shots)
  const getDisplayName = (name: string) => {
    if (name.includes(': ')) {
      return name.split(': ')[1];
    }
    return name;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Section */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumb navigation */}
          <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
            <Link href="/portfolio" className="hover:text-white transition-colors">
              Portfolio
            </Link>
            {parentCategory && (
              <>
                <span className="text-gray-600">→</span>
                <Link 
                  href={`/portfolio?category=${parentCategory.slug}`}
                  className="hover:text-white transition-colors"
                >
                  {parentCategory.name}
                </Link>
              </>
            )}
            {selectedCategory && !selectedCategory.parentId && (
              <>
                <span className="text-gray-600">→</span>
                <span className="text-white">{selectedCategory.name}</span>
              </>
            )}
            {selectedCategory && selectedCategory.parentId && (
              <>
                <span className="text-gray-600">→</span>
                <span className="text-white">{getDisplayName(selectedCategory.name)}</span>
              </>
            )}
          </nav>

          {/* Title and description */}
          {selectedCategory ? (
            <>
              <h1 className="text-5xl md:text-3xl font-bold text-white mb-4 text-left">
                {selectedCategory.parentId 
                  ? getDisplayName(selectedCategory.name)
                  : selectedCategory.name
                }
              </h1>
              <p className="text-xl md:text-lg text-gray-300 max-w-3xl text-left">
                {selectedCategory.description || 
                  `Showcasing our ${getDisplayName(selectedCategory.name).toLowerCase()} photography collection`
                }
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-3xl font-bold text-white mb-4 text-left">
                Portfolio
              </h1>
              <p className="text-xl md:text-lg text-gray-300 max-w-3xl text-left">
                Explore our photography collections showcasing the art of capturing moments across different genres.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Parent Categories Filter */}
      {categories.length > 0 && (
        <section className="py-4 bg-black border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-wrap gap-4 md:gap-6 text-sm">
              <Link
                href="/portfolio"
                className={`
                  transition-all duration-300 uppercase tracking-wider py-1
                  ${!selectedCategorySlug 
                    ? 'text-white font-semibold border-b-2 border-white' 
                    : 'text-gray-400 hover:text-white'
                  }
                `}
              >
                All
              </Link>
              {categories.map((parent) => (
                <Link
                  key={parent.id}
                  href={`/portfolio?category=${parent.slug}`}
                  className={`
                    transition-all duration-300 uppercase tracking-wider py-1
                    ${(selectedCategory?.id === parent.id || parentCategory?.id === parent.id)
                      ? 'text-white font-semibold border-b-2 border-white'
                      : 'text-gray-400 hover:text-white'
                    }
                  `}
                >
                  {parent.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Subcategory Filter (when a parent is selected) */}
      {activeParent && activeParent.children && activeParent.children.length > 0 && (
        <section className="py-3 bg-gray-900/50 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-wrap gap-3 md:gap-5 text-sm">
              <Link
                href={`/portfolio?category=${activeParent.slug}`}
                className={`
                  transition-all duration-300 tracking-wide py-1
                  ${selectedCategory?.id === activeParent.id
                    ? 'text-white font-medium'
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                All {activeParent.name}
              </Link>
              {activeParent.children.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/portfolio?category=${sub.slug}`}
                  className={`
                    transition-all duration-300 tracking-wide py-1
                    ${selectedCategory?.id === sub.id
                      ? 'text-white font-medium'
                      : 'text-gray-500 hover:text-gray-300'
                    }
                  `}
                >
                  {getDisplayName(sub.name)}
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
              {selectedCategory ? 'No Photos in This Category' : 'No Photos Available'}
            </h3>
            <p className="text-gray-500 mb-4">
              {selectedCategory 
                ? `No photos found in ${getDisplayName(selectedCategory.name)}.`
                : 'No photos have been published yet. Check back soon!'
              }
            </p>
            {selectedCategory && (
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
