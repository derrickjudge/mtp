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

  // Determine grid span based on ACTUAL image aspect ratios for true mosaic layout
  const getGridSpan = () => {
    // Extract actual aspect ratio from metadata
    let aspectRatio = 1; // Default square
    if (photo.metadata?.width && photo.metadata?.height) {
      aspectRatio = photo.metadata.width / photo.metadata.height;
      console.log(`📸 ${photo.title}: ${photo.metadata.width}x${photo.metadata.height} = ${aspectRatio.toFixed(2)} ratio`);
    } else {
      console.log(`⚠️ ${photo.title}: No metadata available, using default square`);
    }
    
    // Add some variation using hash for photos with similar aspect ratios
    const hash = photo.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const variation = Math.abs(hash) % 3; // 0, 1, or 2 for size variations
    
    // Featured photos get prominent placement based on their natural aspect ratio
    if (photo.featured) {
      let result;
      if (aspectRatio > 1.5) {
        result = 'col-span-3 row-span-2'; // Large landscape hero
      } else if (aspectRatio < 0.7) {
        result = 'col-span-2 row-span-3'; // Large portrait hero  
      } else {
        result = 'col-span-2 row-span-2'; // Large square hero
      }
      console.log(`⭐ FEATURED ${photo.title}: aspect=${aspectRatio.toFixed(2)} → ${result}`);
      return result;
    }
    
    // Size based on ACTUAL image proportions - using ONLY standard Tailwind classes
    let result;
    if (aspectRatio > 2.0) {
      // Very wide panoramic (aspect > 2.0)
      result = 'col-span-3 row-span-1';
    } else if (aspectRatio > 1.6) {
      // Wide landscape (aspect 1.6-2.0)
      result = variation === 0 ? 'col-span-3 row-span-1' : 'col-span-3 row-span-2';
    } else if (aspectRatio > 1.3) {
      // Medium landscape (aspect 1.3-1.6)
      result = variation === 0 ? 'col-span-2 row-span-1' : 'col-span-3 row-span-2';
    } else if (aspectRatio > 1.1) {
      // Slightly wide (aspect 1.1-1.3)
      result = variation === 0 ? 'col-span-2 row-span-1' : 'col-span-2 row-span-2';
    } else if (aspectRatio > 0.9) {
      // Square or nearly square (aspect 0.9-1.1) - dramatic but safe variations
      if (variation === 0) {
        result = 'col-span-2 row-span-2'; // Large square
      } else if (variation === 1) {
        result = 'col-span-1 row-span-1'; // Small square
      } else {
        result = 'col-span-2 row-span-2'; // Medium square
      }
    } else if (aspectRatio > 0.7) {
      // Medium portrait (aspect 0.7-0.9)
      result = variation === 0 ? 'col-span-1 row-span-3' : 'col-span-1 row-span-4';
    } else if (aspectRatio > 0.5) {
      // Tall portrait (aspect 0.5-0.7)
      result = variation === 0 ? 'col-span-1 row-span-3' : 'col-span-1 row-span-4';
    } else {
      // Very tall portrait (aspect < 0.5)
      result = 'col-span-1 row-span-4';
    }
    
    return result;
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
      <div className={`bg-gray-800 ${getGridSpan()}`} />
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
        h-full w-full
      `}
      onClick={handleClick}
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
            object-contain transition-all duration-700 ease-out
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

  // Helper to get grid span for a photo
  const getGridSpanForPhoto = (photo: Photo) => {
    if (!photo.metadata?.aspectRatio) {
      return 'col-span-1 row-span-1';
    }
    
    const aspectRatio = photo.metadata.aspectRatio;
    
    // Create variation based on photo index for dramatic differences
    const photoIndex = photos.findIndex(p => p.id === photo.id);
    const variation = (photoIndex % 3) + 1; // 1, 2, or 3
    
    if (aspectRatio > 1.4) {
      // Wide photos - vary dramatically by index
      return variation === 1 ? 'col-span-1 row-span-1' : 
             variation === 2 ? 'col-span-3 row-span-2' : 
             'col-span-4 row-span-1';
    } else if (aspectRatio < 0.9) {
      // Tall photos - vary dramatically by index  
      return variation === 1 ? 'col-span-1 row-span-1' :
             variation === 2 ? 'col-span-1 row-span-4' :
             'col-span-2 row-span-3';
    } else {
      // Square-ish photos - vary dramatically by index
      return variation === 1 ? 'col-span-1 row-span-1' :
             variation === 2 ? 'col-span-2 row-span-2' :
             'col-span-3 row-span-3';
    }
  };

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
      {/* Dynamic Masonry Grid */}
      <div 
        className="
          grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6
          gap-3
          max-w-7xl mx-auto px-4
        "
        style={{
          gridAutoRows: '200px',
          gridAutoFlow: 'row dense',
        }}
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            ref={(node) => observePhoto(node, photo.id)}
            className={getGridSpanForPhoto(photo)}
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
