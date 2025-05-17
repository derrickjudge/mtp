"use client";

import React, { useState } from 'react';
import NextImage, { ImageProps as NextImageProps } from 'next/image';
import { PlaceholderImage } from './PlaceholderImage';
import { cn } from '@/utils/cn';

interface ImageProps extends Omit<NextImageProps, 'onError'> {
  fallbackText?: string;
}

export function Image({ fallbackText, className, ...props }: ImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <PlaceholderImage
        text={fallbackText}
        className={cn('relative', className)}
        width={typeof props.width === 'string' ? parseInt(props.width) : props.width}
        height={typeof props.height === 'string' ? parseInt(props.height) : props.height}
      />
    );
  }

  return (
    <NextImage
      {...props}
      className={className}
      onError={() => setHasError(true)}
    />
  );
} 