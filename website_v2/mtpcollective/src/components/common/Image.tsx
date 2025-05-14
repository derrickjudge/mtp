'use client';

import React, { useState } from 'react';
import NextImage, { ImageProps as NextImageProps } from 'next/image';

interface ImageProps extends Omit<NextImageProps, 'onError'> {
  fallbackSrc?: string;
}

const Image: React.FC<ImageProps> = ({
  src,
  alt,
  fallbackSrc = '/images/placeholder.jpg',
  className = '',
  fill,
  sizes = fill ? '100vw' : undefined,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  const containerClasses = fill 
    ? 'relative w-full h-full min-h-[200px]'
    : 'relative';

  return (
    <div className={`${containerClasses} ${className}`}>
      <NextImage
        src={imgSrc}
        alt={alt}
        fill={fill}
        sizes={sizes}
        className={`
          duration-700 ease-in-out
          ${isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'}
          ${fill ? 'object-cover' : ''}
        `}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.error(`Failed to load image: ${imgSrc}`);
          setImgSrc(fallbackSrc);
          setIsLoading(false);
        }}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default Image; 