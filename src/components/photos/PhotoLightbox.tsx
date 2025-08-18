'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Photo } from '@/types/photo';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PhotoLightboxProps {
  photos: Photo[];
  currentPhotoIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function PhotoLightbox({
  photos,
  currentPhotoIndex,
  isOpen,
  onClose,
  onPrevious,
  onNext,
}: PhotoLightboxProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const currentPhoto = photos[currentPhotoIndex];

  // Reset image state when photo changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setIsZoomed(false);
  }, [currentPhotoIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentPhotoIndex > 0) onPrevious();
          break;
        case 'ArrowRight':
          if (currentPhotoIndex < photos.length - 1) onNext();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPhotoIndex, photos.length, onClose, onPrevious, onNext]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  if (!isOpen || !currentPhoto) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 bg-black/95 backdrop-blur-sm
        transition-opacity duration-300 ease-out
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label="Close lightbox"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

      {/* Navigation buttons */}
      {currentPhotoIndex > 0 && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Previous photo"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      )}

      {currentPhotoIndex < photos.length - 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Next photo"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      )}

      {/* Photo counter */}
      <div className="absolute top-4 left-4 z-10 px-3 py-2 rounded-full bg-black/50 text-white text-sm">
        {currentPhotoIndex + 1} / {photos.length}
      </div>

      {/* Main content area */}
      <div className="flex flex-col h-full">
        {/* Image container */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div
            ref={imageRef}
            className={`
              relative max-w-full max-h-full cursor-pointer
              transition-transform duration-300 ease-out
              ${isZoomed ? 'scale-150' : 'scale-100'}
            `}
            onClick={toggleZoom}
          >
            {/* Loading indicator */}
            {!imageLoaded && !imageError && (
              <div className="flex items-center justify-center w-96 h-64 bg-gray-800 rounded-lg">
                <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
              </div>
            )}

            {/* Main image */}
            {!imageError && (
              <Image
                src={currentPhoto.url}
                alt={currentPhoto.title}
                width={1200}
                height={800}
                className={`
                  max-w-full max-h-[calc(100vh-200px)] w-auto h-auto object-contain rounded-lg
                  transition-opacity duration-500
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                onLoad={handleImageLoad}
                onError={handleImageError}
                quality={100}
                priority
              />
            )}

            {/* Error state */}
            {imageError && (
              <div className="flex items-center justify-center w-96 h-64 bg-gray-800 rounded-lg">
                <div className="text-gray-400 text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-sm">Failed to load image</p>
                </div>
              </div>
            )}

            {/* Zoom indicator */}
            {imageLoaded && !imageError && (
              <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/50 text-white text-xs rounded">
                {isZoomed ? 'Click to zoom out' : 'Click to zoom in'}
              </div>
            )}
          </div>
        </div>

        {/* Photo information */}
        <div className="bg-black/80 backdrop-blur-sm border-t border-gray-700">
          <div className="max-w-4xl mx-auto p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Photo details */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {currentPhoto.title}
                  {currentPhoto.featured && (
                    <span className="ml-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Featured
                    </span>
                  )}
                </h2>
                {currentPhoto.description && (
                  <p className="text-gray-300 mb-3">{currentPhoto.description}</p>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span>Photo {currentPhotoIndex + 1} of {photos.length}</span>
                  <span>{new Date(currentPhoto.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Tags and categories */}
              <div className="flex flex-col gap-2">
                {/* Categories */}
                {currentPhoto.categories && currentPhoto.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {currentPhoto.categories.map((category) => (
                      <span
                        key={category.id}
                        className="px-2 py-1 bg-blue-600/80 text-white rounded text-xs"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {currentPhoto.tags && currentPhoto.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {currentPhoto.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-1 bg-gray-600/80 text-white rounded text-xs"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Events */}
                {currentPhoto.events && currentPhoto.events.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {currentPhoto.events.map((event) => (
                      <span
                        key={event.id}
                        className="px-2 py-1 bg-purple-600/80 text-white rounded text-xs"
                      >
                        {event.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation hints */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-gray-400 text-sm">
        <p>Use arrow keys to navigate • ESC to close • Click image to zoom</p>
      </div>
    </div>
  );
}
