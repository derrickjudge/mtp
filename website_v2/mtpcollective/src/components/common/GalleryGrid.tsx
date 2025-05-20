import { PhotoCard } from './PhotoCard';
import { cn } from '@/utils/cn';
import { Photo } from '@/types/photo';

interface GalleryGridProps {
  photos: Photo[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
};

export function GalleryGrid({
  photos,
  columns = 3,
  className,
  gap = 'md',
}: GalleryGridProps) {
  return (
    <div
      className={cn(
        'grid',
        columnClasses[columns],
        gapClasses[gap],
        className
      )}
    >
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          src={photo.url}
          alt={photo.title}
          title={photo.title}
          description={photo.description}
          priority={index < 4} // Prioritize loading first 4 images
        />
      ))}
    </div>
  );
} 