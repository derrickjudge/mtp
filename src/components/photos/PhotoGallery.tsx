'use client';

import { useState, useMemo } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Photo } from '@/types/photo';
import { cn } from '@/utils/cn';
import Image from 'next/image';

interface PhotoGalleryProps {
  photos: Photo[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export function PhotoGallery({
  photos,
  columns = 3,
  className,
  gap = 'md',
}: PhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Sort and filter photos
  const filteredAndSortedPhotos = useMemo(() => {
    let result = [...photos];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        photo =>
          photo.title.toLowerCase().includes(query) ||
          photo.description?.toLowerCase().includes(query) ||
          photo.categories.some(cat => cat.name.toLowerCase().includes(query)) ||
          photo.tags.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'title-asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return result;
  }, [photos, sortBy, searchQuery]);

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search photos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Gallery Grid */}
      <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
        {filteredAndSortedPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
            onClick={() => setSelectedPhotoIndex(index)}
          >
            <div className="aspect-square relative">
              <Image
                src={photo.url}
                alt={photo.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={index < 4}
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="text-lg font-semibold truncate">{photo.title}</h3>
              {photo.description && (
                <p className="text-sm opacity-90 line-clamp-2">{photo.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Lightbox
        open={selectedPhotoIndex !== null}
        close={() => setSelectedPhotoIndex(null)}
        index={selectedPhotoIndex ?? 0}
        slides={filteredAndSortedPhotos.map(photo => ({
          src: photo.url,
          alt: photo.title,
          title: photo.title,
          description: photo.description,
        }))}
        controller={{ closeOnBackdropClick: true }}
      />
    </div>
  );
} 