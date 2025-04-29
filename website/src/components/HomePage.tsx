'use client';

import React from 'react';
import HeroSection from './HeroSection';
import FeaturedPhotos from './FeaturedPhotos';
import CategorySection from './CategorySection';

const HomePage: React.FC = () => {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Featured Photos */}
      <FeaturedPhotos title="Recent Work" limit={6} />
      
      {/* Category Section */}
      <CategorySection />
      
      {/* About Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-6">About MTP Collective</h2>
            <p className="text-gray-300 text-lg mb-8">
              MTP Collective is a photography studio specializing in concert, automotive, and nature photography. 
              Our mission is to capture moments that tell powerful stories and evoke emotion.
            </p>
            <a 
              href="/about" 
              className="inline-block px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-colors duration-300"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
