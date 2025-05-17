import { cn } from '@/utils/cn';

interface PlaceholderImageProps {
  text?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function PlaceholderImage({
  text = 'Image Placeholder',
  className,
  width = 800,
  height = 600,
}: PlaceholderImageProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gray-800 text-gray-400',
        className
      )}
      style={{ width, height }}
    >
      <p className="text-lg font-medium">{text}</p>
    </div>
  );
} 