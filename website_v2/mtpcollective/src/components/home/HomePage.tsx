'use client';

import React from 'react';
import HeroSection from './HeroSection';
import FeaturedPhotos from './FeaturedPhotos';
import CategorySection from './CategorySection';
import AboutSection from './AboutSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedPhotos />
      <CategorySection />
      <AboutSection />
    </>
  );
}
