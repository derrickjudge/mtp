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
    
    console.log(`🎯 ${photo.title}: aspect=${aspectRatio.toFixed(2)} variation=${variation} → ${result}`);
    return result;
  };

  const handleImageLoad = () => {
    console.log(`✅ Image loaded successfully: ${photo.title}`);
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.log(`❌ Image failed to load: ${photo.title} - ${photo.url}`);
    setImageError(true);
  };

  const handleClick = () => {
    onPhotoClick(photo);
  };

  // DEBUG: Log PhotoItem render state
  console.log(`🔍 PhotoItem ${photo.title}:`, {
    isVisible,
    imageLoaded,
    imageError,
    gridSpan: getGridSpan(),
    photoUrl: photo.url
  });

  if (!isVisible) {
    return (
      <div 
        className={`bg-red-500 ${getGridSpan()}`}
        style={{
          border: '2px solid blue',
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px'
        }}
      >
        NOT VISIBLE: {photo.title}
      </div>
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
      style={{
        border: '3px solid green', // DEBUG: Make visible photos obvious
        minHeight: '120px', // DEBUG: Force minimum height
        height: '100%', // DEBUG: Fill the grid container completely
        width: '100%', // DEBUG: Fill the grid container completely
      }}
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

      {/* Error fallback - DEBUG VERSION */}
      {imageError && (
        <div className="absolute inset-0 bg-red-600 flex items-center justify-center">
          <div className="text-white text-center p-2">
            <div className="text-4xl mb-2">❌</div>
            <p className="text-xs font-bold">IMAGE ERROR</p>
            <p className="text-xs">{photo.title}</p>
            <p className="text-xs break-all">{photo.url}</p>
          </div>
        </div>
      )}

      {/* DEBUG: Show loading state */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-purple-600 flex items-center justify-center text-white text-center">
          <div>
            <div className="text-2xl mb-2">🔄</div>
            <p className="text-xs">LOADING</p>
            <p className="text-xs">{photo.title}</p>
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
    console.log(`📸 ${photo.title}: ${photo.metadata.width}x${photo.metadata.height} = ${aspectRatio.toFixed(2)} ratio`);
    
    // Create variation based on photo index for dramatic differences
    const photoIndex = photos.findIndex(p => p.id === photo.id);
    const variation = (photoIndex % 3) + 1; // 1, 2, or 3
    
    let result: string;
    
    if (aspectRatio > 1.4) {
      // Wide photos - vary dramatically by index
      result = variation === 1 ? 'col-span-1 row-span-1' : 
               variation === 2 ? 'col-span-3 row-span-2' : 
               'col-span-4 row-span-1';
    } else if (aspectRatio < 0.9) {
      // Tall photos - vary dramatically by index  
      result = variation === 1 ? 'col-span-1 row-span-1' :
               variation === 2 ? 'col-span-1 row-span-4' :
               'col-span-2 row-span-3';
    } else {
      // Square-ish photos - vary dramatically by index
      result = variation === 1 ? 'col-span-1 row-span-1' :
               variation === 2 ? 'col-span-2 row-span-2' :
               'col-span-3 row-span-3';
    }
    
    console.log(`🎯 ${photo.title}: aspect=${aspectRatio.toFixed(2)} variation=${variation} → ${result}`);
    return result;
  };

  // DEBUG: Helper functions to extract span numbers for inline styles
  const getColSpan = (photo: Photo) => {
    const gridSpan = getGridSpanForPhoto(photo);
    const match = gridSpan.match(/col-span-(\d+)/);
    return match ? parseInt(match[1]) : 1;
  };

  const getRowSpan = (photo: Photo) => {
    const gridSpan = getGridSpanForPhoto(photo);
    const match = gridSpan.match(/row-span-(\d+)/);
    return match ? parseInt(match[1]) : 1;
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

  // DEBUG: Add console logging
  console.log('🔍 PhotoCollage render:', {
    photosLength: photos.length,
    visiblePhotosSize: visiblePhotos.size,
    visiblePhotosArray: Array.from(visiblePhotos),
    photosData: photos.map(p => ({ id: p.id, title: p.title, url: p.url }))
  });

  return (
    <div className="w-full">
      {/* DEBUG INFO */}
      <div className="bg-yellow-300 text-black p-4 mb-4 text-sm">
        <strong>🔍 DEBUG INFO:</strong><br/>
        Photos Count: {photos.length}<br/>
        Visible Photos: {visiblePhotos.size}<br/>
        Photo IDs: {photos.map(p => p.title).join(', ')}
      </div>

      {/* Dynamic Masonry Grid - WITH DEBUG STYLING */}
      <div 
        className="
          grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6
          gap-3
          max-w-7xl mx-auto px-4
        "
        style={{
          gridAutoRows: '200px', // Increased row height for better aspect ratios
          gridAutoFlow: 'row dense', // Allow items to fill gaps
          minHeight: '600px', // DEBUG: Force minimum height
          border: '5px solid red', // DEBUG: Make container visible
          backgroundColor: 'rgba(255, 255, 0, 0.1)', // DEBUG: Light yellow background
        }}
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            ref={(node) => observePhoto(node, photo.id)}
            className={getGridSpanForPhoto(photo)}
            style={{
              // DEBUG: Force inline styles to bypass Tailwind issues
              gridColumnEnd: `span ${getColSpan(photo)}`,
              gridRowEnd: `span ${getRowSpan(photo)}`,
              border: '2px solid orange',
              minHeight: '120px',
            }}
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
