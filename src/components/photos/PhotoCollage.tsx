'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Photo } from '@/types/photo';

interface PhotoCollageProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

interface PhotoItemProps {
  photo: Photo;
  onPhotoClick: (photo: Photo) => void;
  isVisible: boolean;
}

// Individual photo item with lazy loading and fade animation
function PhotoItem({ photo, onPhotoClick, isVisible }: PhotoItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Determine grid span based on photo characteristics
  const getGridSpan = () => {
    // Featured photos get larger spans
    if (photo.featured) {
      return 'row-span-2 col-span-2';
    }
    
    // Random variation for visual interest
    const rand = Math.random();
    if (rand < 0.3) {
      return 'row-span-2'; // Tall photos
    } else if (rand < 0.6) {
      return 'col-span-2'; // Wide photos
    }
    return ''; // Standard size
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleClick = () => {
    onPhotoClick(photo);
  };

  if (!isVisible) {
    return (
      <div className={`bg-gray-800 rounded-lg ${getGridSpan()}`} style={{ minHeight: '200px' }} />
    );
  }

  return (
    <div 
      className={`
        relative group cursor-pointer overflow-hidden rounded-lg bg-gray-800
        transition-all duration-500 ease-out
        ${getGridSpan()}
        ${imageLoaded ? 'opacity-100' : 'opacity-0'}
        hover:scale-[1.02] hover:shadow-2xl
      `}
      onClick={handleClick}
      style={{ minHeight: '200px' }}
    >
      {/* Loading placeholder */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Main image */}
      {!imageError && (
        <Image
          src={photo.url}
          alt={photo.title}
          fill
          className={`
            object-cover transition-all duration-700 ease-out
            ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
            group-hover:scale-110
          `}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onLoad={handleImageLoad}
          onError={handleImageError}
          quality={85}
        />
      )}

      {/* Error fallback */}
      {imageError && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-sm">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Overlay with photo info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-lg mb-1">{photo.title}</h3>
          {photo.description && (
            <p className="text-gray-200 text-sm line-clamp-2">{photo.description}</p>
          )}
          
          {/* Featured badge */}
          {photo.featured && (
            <div className="absolute top-4 right-4">
              <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                Featured
              </span>
            </div>
          )}

          {/* Categories */}
          {photo.categories && photo.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {photo.categories.slice(0, 2).map((category) => (
                <span
                  key={category.id}
                  className="bg-blue-600/80 text-white px-2 py-1 rounded text-xs"
                >
                  {category.name}
                </span>
              ))}
              {photo.categories.length > 2 && (
                <span className="bg-gray-600/80 text-white px-2 py-1 rounded text-xs">
                  +{photo.categories.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Click indicator */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function PhotoCollage({ photos, onPhotoClick }: PhotoCollageProps) {
  const [visiblePhotos, setVisiblePhotos] = useState(new Set<string>());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection observer callback for lazy loading
  const observePhoto = useCallback((node: HTMLDivElement | null, photoId: string) => {
    if (!node) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisiblePhotos(prev => new Set(prev).add(photoId));
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    observerRef.current.observe(node);
  }, []);

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📸</div>
        <h3 className="text-2xl font-semibold text-gray-400 mb-2">No Photos Found</h3>
        <p className="text-gray-500">
          No photos match the current filter. Try selecting a different category.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Masonry Grid */}
      <div 
        className="
          grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
          auto-rows-[200px] gap-4
          max-w-7xl mx-auto px-4
        "
        style={{
          gridAutoFlow: 'row dense', // Allow items to fill gaps
        }}
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            ref={(node) => observePhoto(node, photo.id)}
          >
            <PhotoItem
              photo={photo}
              onPhotoClick={onPhotoClick}
              isVisible={visiblePhotos.has(photo.id)}
            />
          </div>
        ))}
      </div>

      {/* Loading indicator for more content */}
      {photos.length === 0 && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
