'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Photo {
  id: string;
  src: string;
  alt: string;
  title: string;
  category: string;
}

const photos: Photo[] = [
  {
    id: '1',
    src: '/images/featured/concert-1.jpg',
    alt: 'Concert photo 1',
    title: 'Live Performance',
    category: 'Concert'
  },
  {
    id: '2',
    src: '/images/featured/auto-1.jpg',
    alt: 'Automotive photo 1',
    title: 'Classic Beauty',
    category: 'Automotive'
  },
  {
    id: '3',
    src: '/images/featured/nature-1.jpg',
    alt: 'Nature photo 1',
    title: 'Mountain Vista',
    category: 'Nature'
  },
  {
    id: '4',
    src: '/images/featured/concert-2.jpg',
    alt: 'Concert photo 2',
    title: 'Stage Lights',
    category: 'Concert'
  },
  {
    id: '5',
    src: '/images/featured/auto-2.jpg',
    alt: 'Automotive photo 2',
    title: 'Modern Speed',
    category: 'Automotive'
  },
  {
    id: '6',
    src: '/images/featured/nature-2.jpg',
    alt: 'Nature photo 2',
    title: 'Forest Path',
    category: 'Nature'
  }
];

interface Props {
  title?: string;
  limit?: number;
}

export default function FeaturedPhotos({ title = "Featured Photography", limit = 6 }: Props) {
  const displayPhotos = photos.slice(0, limit);

  return (
    <section className="py-20 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-heading font-semibold text-white mb-12 text-center">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayPhotos.map((photo) => (
            <Link 
              key={photo.id} 
              href={`/photos/${photo.id}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-900"
            >
              <div className="absolute inset-0">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-lg font-heading font-medium text-white mb-1">
                  {photo.title}
                </h3>
                <p className="text-sm text-gray-300">
                  {photo.category}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/photos"
            className="inline-block bg-white text-black px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
          >
            View All Photos
          </Link>
        </div>
      </div>
    </section>
  );
}
