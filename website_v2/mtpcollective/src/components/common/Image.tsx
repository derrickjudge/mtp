"use client";

import React, { useState } from 'react';
import NextImage, { ImageProps as NextImageProps } from 'next/image';

interface ImageProps extends Omit<NextImageProps, 'onError'> {
  fallbackSrc?: string;
}

export function Image({ fallbackSrc = '/placeholder.svg', ...props }: ImageProps) {
  const [src, setSrc] = useState(props.src);

  return (
    <NextImage
      {...props}
      src={src}
      onError={() => {
        if (src !== fallbackSrc) {
          setSrc(fallbackSrc);
        }
      }}
    />
  );
} 