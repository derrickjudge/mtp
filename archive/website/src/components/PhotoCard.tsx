'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface PhotoCardProps {
  id: string;
  imageUrl: string;
  title: string;
  category: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  priority?: boolean;
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  id,
  imageUrl,
  title,
  category,
  aspectRatio = 'square',
  priority = false,
}) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[2/3]',
    landscape: 'aspect-[3/2]',
  };

  return (
    <div className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.01]">
      <Link href={`/portfolio/${id}`}>
        <div className={`relative ${aspectRatioClasses[aspectRatio]} w-full overflow-hidden bg-gray-900`}>
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-all duration-500 group-hover:scale-105"
            priority={priority}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <h3 className="text-white text-lg font-bold truncate">{title}</h3>
            <p className="text-gray-300 text-sm">{category}</p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PhotoCard;
