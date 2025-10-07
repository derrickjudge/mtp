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

  // Compute intrinsic dimensions for Next/Image to preserve aspect ratio and avoid CLS
  const intrinsicWidth = (photo.metadata?.width && Number.isFinite(photo.metadata.width)) ? photo.metadata.width : 1200;
  const intrinsicHeight = (photo.metadata?.height && Number.isFinite(photo.metadata.height)) ? photo.metadata.height : 900;

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
      <div className="mb-4 sm:mb-6 lg:mb-8 break-inside-avoid inline-block w-full" />
    );
  }

  return (
    <div 
      className={`
        relative group cursor-pointer overflow-hidden
        transition-transform duration-300 ease-out
        ${imageLoaded ? 'opacity-100' : 'opacity-0'}
        w-full inline-block align-top
        mb-4 sm:mb-6 lg:mb-8 break-inside-avoid
      `}
      onClick={handleClick}
    >
      {/* Loading placeholder */}
      {!imageLoaded && !imageError && (
        <div className="relative w-full">
          <div className="w-8 h-8 border-4 border-gray-400 border-t-white rounded-full animate-spin mx-auto my-6" />
        </div>
      )}

      {/* Main image */}
      {!imageError && (
        <Image
          src={photo.url}
          alt={photo.title}
          width={intrinsicWidth}
          height={intrinsicHeight}
          className={`
            block w-full h-auto object-cover
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            group-hover:scale-[1.01]
          `}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
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

      {/* Overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="px-4 pt-10 pb-3">
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

  // Helper to get grid span for a photo based on aspect ratio
  // Grid span no longer needed for masonry columns; keeping function stub for API stability
  const getGridSpanForPhoto = (_photo: Photo) => '';

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
      {/* Masonry Columns: equal column widths, variable heights */}
      <div 
        className="
          max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8
          columns-1 sm:columns-2 md:columns-3 2xl:columns-4
          [column-gap:0.5rem] sm:[column-gap:0.75rem] md:[column-gap:2px] 2xl:[column-gap:1rem] [column-fill:_balance]
        "
      >
        {photos.map((photo) => (
          <div key={photo.id} ref={(node) => observePhoto(node, photo.id)}>
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
