"use client";

import React, { useState } from 'react';
import NextImage, { ImageProps as NextImageProps } from 'next/image';

interface ImageProps extends Omit<NextImageProps, 'onError'> {
  fallbackSrc?: string;
}

const Image: React.FC<ImageProps> = ({ 
  src, 
  alt, 
  fallbackSrc = '/placeholder.svg',
  onLoad,
  className = '',
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <div className={`relative w-full h-full ${imgSrc === null ? 'animate-pulse bg-gray-200' : ''}`}>
      <NextImage
        {...props}
        alt={alt}
        src={imgSrc}
        onLoad={onLoad}
        onError={() => {
          setImgSrc(fallbackSrc);
        }}
        className={`object-cover ${className}`}
      />
    </div>
  );
};

export default Image; 