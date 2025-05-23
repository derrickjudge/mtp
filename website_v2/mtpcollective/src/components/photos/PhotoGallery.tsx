'use client';

import { useState, useMemo } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { GalleryGrid } from '@/components/common/GalleryGrid';
import { Photo } from '@/types/photo';
import { cn } from '@/utils/cn';

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
      <GalleryGrid
        photos={filteredAndSortedPhotos}
        columns={columns}
        className={className}
        gap={gap}
        onPhotoClick={(index) => setSelectedPhotoIndex(index)}
      />

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