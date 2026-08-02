'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';

/**
 * The photo shape returned with an article by
 * `nativeDB.getArticleWithRelations` — deliberately lighter than the full
 * `Photo` type, which carries relations an article gallery does not need.
 */
export interface ArticleGalleryPhoto {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  thumbnail?: string | null;
}

interface ArticlePhotoGalleryProps {
  photos: ArticleGalleryPhoto[];
}

/**
 * Inline gallery for an article's curated photo set. Photos arrive in their
 * curated order and are rendered as-is; clicking one opens a lightbox that
 * can be paged through with the arrow keys.
 */
export function ArticlePhotoGallery({ photos }: ArticlePhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const close = useCallback(() => setSelectedIndex(null), []);

  const step = useCallback(
    (delta: number) => {
      setSelectedIndex(current => {
        if (current === null) return current;
        return (current + delta + photos.length) % photos.length;
      });
    },
    [photos.length]
  );

  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, close, step]);

  if (photos.length === 0) {
    return null;
  }

  const selectedPhoto = selectedIndex === null ? null : photos[selectedIndex];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelectedIndex(index)}
            aria-label={`View ${photo.title}`}
            className="relative aspect-[4/3] group overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Image
              src={photo.thumbnail || photo.url}
              alt={photo.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300" />
          </button>
        ))}
      </div>

      {selectedPhoto && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.title}
          onClick={close}
        >
          <div
            className="relative max-w-6xl w-full mx-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="relative aspect-[4/3] w-full">
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                fill
                className="object-contain"
                sizes="(max-width: 1280px) 100vw, 1280px"
                priority
              />
            </div>

            {photos.length > 1 && (
              <>
                <button
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            <div className="mt-4 text-center text-white">
              <h3 className="text-lg font-semibold">{selectedPhoto.title}</h3>
              {selectedPhoto.description && (
                <p className="text-sm text-gray-300 mt-1">{selectedPhoto.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {selectedIndex + 1} of {photos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
