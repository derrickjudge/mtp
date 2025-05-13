'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { PhotoModal } from './PhotoModal';

type Photo = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail: string | null;
  featured: boolean;
  author: {
    id: string;
    name: string;
  };
};

type PhotoGridProps = {
  photos: Photo[];
};

export function PhotoGrid({ photos }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
            onClick={() => setSelectedPhoto(photo)}
          >
            <div className="aspect-square relative">
              <Image
                src={photo.thumbnail || photo.url}
                alt={photo.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="text-lg font-semibold truncate">{photo.title}</h3>
              <p className="text-sm opacity-90">by {photo.author.name}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </>
  );
}
