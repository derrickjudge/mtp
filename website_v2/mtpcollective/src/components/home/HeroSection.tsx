'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HeroImage {
  src: string;
  alt: string;
  category: string;
}

const heroImages: HeroImage[] = [
  {
    src: '/images/hero-concert.jpg',
    alt: 'Concert photography',
    category: 'CONCERTS'
  },
  {
    src: '/images/hero-auto.jpg',
    alt: 'Automotive photography',
    category: 'AUTOMOTIVE'
  },
  {
    src: '/images/hero-nature.jpg',
    alt: 'Nature photography',
    category: 'NATURE'
  }
];

export default function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-black">
      {/* Hero images */}
      {heroImages.map((image, index) => (
        <div
          key={image.src}
          data-testid="hero-image-container"
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority={index === 0}
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4">
        <h1 className="mb-4 text-4xl font-heading font-bold tracking-tighter sm:text-5xl md:text-6xl">
          MTP COLLECTIVE
        </h1>
        <p className="mb-6 max-w-2xl text-xl text-gray-300">
          Capturing moments through a unique lens
        </p>
        <div className="flex space-x-3 text-sm font-heading font-semibold tracking-wider opacity-80">
          <span>CONCERTS</span>
          <span>•</span>
          <span>AUTOMOTIVE</span>
          <span>•</span>
          <span>NATURE</span>
        </div>
        
        <div className="mt-10 flex gap-4">
          <Link
            href="/photos"
            className="rounded-md bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gray-100"
          >
            View Gallery
          </Link>
          <Link
            href="/contact"
            className="rounded-md border border-white px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Get in Touch
          </Link>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center space-x-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
