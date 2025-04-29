'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPlaceholderImage } from '../utils/placeholderImages';

// Sample categories with placeholder images
const categories = [
  {
    id: 'concerts',
    name: 'Concerts',
    description: 'Capturing the energy and atmosphere of live music performances.',
    imageUrl: getPlaceholderImage({ width: 800, height: 1200, id: 'cat1' }),
  },
  {
    id: 'automotive',
    name: 'Automotive',
    description: 'Sleek lines and powerful machines in their element.',
    imageUrl: getPlaceholderImage({ width: 800, height: 1200, id: 'cat2' }),
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'The beauty of natural landscapes and wildlife.',
    imageUrl: getPlaceholderImage({ width: 800, height: 1200, id: 'cat3' }),
  },
];

const CategorySection: React.FC = () => {
  return (
    <section className="py-16 bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-12 text-center">Explore Categories</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link 
              key={category.id}
              href={`/portfolio?category=${category.id}`}
              className="group"
            >
              <div className="relative overflow-hidden rounded-lg aspect-[3/4]">
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <h3 className="text-xl font-bold text-white">{category.name}</h3>
                  <p className="text-gray-300 mt-2">{category.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
