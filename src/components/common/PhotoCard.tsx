import { Image } from '@/components/common/Image';
import { cn } from '@/utils/cn';

interface PhotoCardProps {
  src: string;
  alt: string;
  title?: string;
  description?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
  className?: string;
  priority?: boolean;
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
};

export function PhotoCard({
  src,
  alt,
  title,
  description,
  aspectRatio = 'square',
  className,
  priority = false,
}: PhotoCardProps) {
  return (
    <div className={cn('relative w-full overflow-hidden rounded-lg group', className)}>
      <div className={cn('relative w-full', aspectRatioClasses[aspectRatio])}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {(title || description) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
            <div className="text-white">
              {title && (
                <h3 className="text-xl font-bold mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-gray-200 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 