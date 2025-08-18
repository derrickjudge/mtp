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

  // Determine grid span based on natural image proportions
  const getGridSpan = () => {
    let aspectRatio = 1; // Default square
    
    // Use image metadata if available
    if (photo.metadata?.width && photo.metadata?.height) {
      aspectRatio = photo.metadata.width / photo.metadata.height;
    } else {
      // Fallback: create variation using photo ID for consistency
      const hash = photo.id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const variations = [0.7, 0.8, 1.0, 1.2, 1.5, 1.8]; // Portrait to landscape
      aspectRatio = variations[Math.abs(hash) % variations.length];
    }
    
    // Featured photos get prominent placement regardless of aspect ratio
    if (photo.featured) {
      if (aspectRatio > 1.3) {
        return 'col-span-3 row-span-2'; // Large landscape featured
      } else if (aspectRatio < 0.8) {
        return 'col-span-2 row-span-4'; // Large portrait featured
      } else {
        return 'col-span-2 row-span-3'; // Large square featured
      }
    }
    
    // Natural sizing based on actual image proportions
    if (aspectRatio > 2.0) {
      return 'col-span-3 row-span-1'; // Panoramic landscape
    } else if (aspectRatio > 1.6) {
      return 'col-span-2 row-span-1'; // Wide landscape
    } else if (aspectRatio > 1.3) {
      return 'col-span-2 row-span-2'; // Medium landscape
    } else if (aspectRatio > 1.1) {
      return 'col-span-1 row-span-1'; // Slightly wide
    } else if (aspectRatio > 0.9) {
      return 'col-span-1 row-span-2'; // Nearly square
    } else if (aspectRatio > 0.6) {
      return 'col-span-1 row-span-2'; // Medium portrait
    } else if (aspectRatio > 0.4) {
      return 'col-span-1 row-span-3'; // Tall portrait
    } else {
      return 'col-span-1 row-span-4'; // Very tall portrait
    }
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
      <div className={`bg-gray-800 ${getGridSpan()}`} style={{ minHeight: '200px' }} />
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
      {/* Natural Masonry Grid */}
      <div 
        className="
          grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
          gap-4
          max-w-7xl mx-auto px-4
        "
        style={{
          gridAutoRows: 'minmax(200px, auto)',
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
