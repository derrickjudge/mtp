'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
      return 'row-span-3 col-span-2';
    }
    
    // Random variation for visual interest
    const rand = Math.random();
    if (rand < 0.25) {
      return 'row-span-2'; // Tall photos
    } else if (rand < 0.5) {
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
      <div className={`bg-gray-800 ${getGridSpan()}`} style={{ minHeight: '300px' }} />
    );
  }

  return (
    <div 
      className={`
        relative group cursor-pointer overflow-hidden bg-gray-800
        transition-all duration-500 ease-out
        ${getGridSpan()}
        ${imageLoaded ? 'opacity-100' : 'opacity-0'}
        hover:opacity-80
      `}
      onClick={handleClick}
      style={{ minHeight: '300px' }}
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
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onLoad={handleImageLoad}
          onError={handleImageError}
          quality={85}
          unoptimized={process.env.NODE_ENV === 'production'}
          priority={false}
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

      {/* Minimal Overlay - Steven Carlson Style */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-white font-semibold text-xl mb-2 uppercase tracking-wider">{photo.title}</h3>
          {photo.description && (
            <p className="text-gray-300 text-sm">{photo.description}</p>
          )}
        </div>
        
        {/* Featured indicator */}
        {photo.featured && (
          <div className="absolute top-4 right-4">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PhotoCollage({ photos, onPhotoClick }: PhotoCollageProps) {
  // Initialize with first 6 photos visible for immediate display
  const [visiblePhotos, setVisiblePhotos] = useState(() => {
    const initial = new Set<string>();
    photos.slice(0, 6).forEach(photo => initial.add(photo.id));
    return initial;
  });
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Update visible photos when photos array changes (e.g., category filtering)
  useEffect(() => {
    const initial = new Set<string>();
    photos.slice(0, 6).forEach(photo => initial.add(photo.id));
    setVisiblePhotos(initial);
  }, [photos]);

  // Initialize intersection observer once
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const photoId = entry.target.getAttribute('data-photo-id');
            if (photoId) {
              setVisiblePhotos(prev => new Set(prev).add(photoId));
              observerRef.current?.unobserve(entry.target);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Ref callback for observing elements
  const observePhoto = useCallback((node: HTMLDivElement | null, photoId: string) => {
    if (node && observerRef.current) {
      node.setAttribute('data-photo-id', photoId);
      observerRef.current.observe(node);
    }
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
      {/* Steven Carlson Style Grid */}
      <div 
        className="
          grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
          auto-rows-[300px] gap-6
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
