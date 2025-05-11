'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const categories = [
  {
    id: 'concerts',
    title: 'Concert Photography',
    description: 'Capturing the energy and emotion of live performances',
    image: '/images/categories/concerts.jpg',
    link: '/photos?category=concerts'
  },
  {
    id: 'automotive',
    title: 'Automotive Photography',
    description: 'Showcasing the beauty and power of exceptional vehicles',
    image: '/images/categories/automotive.jpg',
    link: '/photos?category=automotive'
  },
  {
    id: 'nature',
    title: 'Nature Photography',
    description: 'Exploring the stunning beauty of the natural world',
    image: '/images/categories/nature.jpg',
    link: '/photos?category=nature'
  }
];

export default function CategorySection() {
  return (
    <section className="py-20 px-4 bg-zinc-900">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-heading font-semibold text-white mb-12 text-center">
          Our Specialties
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link 
              key={category.id}
              href={category.link}
              className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-900"
            >
              <div className="absolute inset-0">
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              </div>
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="text-xl font-heading font-semibold text-white mb-2">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-300 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
