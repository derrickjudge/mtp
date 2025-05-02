'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';
import { getCategories } from '../services/photoService';

// Type definition for photo data
export interface Photo {
  id: string;
  title: string;
  description?: string;
  category: string;
  imageUrl: string;
  width?: number;
  height?: number;
}

interface PortfolioScreenProps {
  photos: Photo[];
  initialCategories?: string[];
}

const PortfolioScreen: React.FC<PortfolioScreenProps> = ({ photos, initialCategories }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>(photos);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const result = await getCategories();
        if (result.success && result.data && result.data.length > 0) {
          // Make sure 'All' is the first category
          const allCategories = ['All', ...result.data.filter(cat => cat !== 'All')];
          setCategories(allCategories);
        } else {
          // Fallback to default categories if API fails
          setCategories(['All', 'Concerts', 'Sports', 'Street', 'Nature', 'Automotive']);
          console.warn('Using default categories due to API error');
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories(['All', 'Concerts', 'Sports', 'Street', 'Nature', 'Automotive']);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    loadCategories();
  }, []);
  
  // Filter photos when category changes
  useEffect(() => {
    if (activeCategory === 'All') {
      setFilteredPhotos(photos);
    } else {
      setFilteredPhotos(photos.filter(photo => photo.category === activeCategory));
    }
  }, [activeCategory, photos]);
  
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Portfolio</h1>
      
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {categoriesLoading ? (
          // Show loading skeleton for categories
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-20 h-10 bg-gray-800 animate-pulse rounded-md"></div>
            ))}
          </div>
        ) : (
          // Show actual categories
          categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeCategory === category
                  ? 'bg-white text-black font-bold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))
        )}
      </div>
      
      {/* Photo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhotos.map((photo, index) => (
          <div 
            key={photo.id} 
            className="relative overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
            onClick={() => {
              setPhotoIndex(index);
              setLightboxOpen(true);
            }}
            data-testid="photo-card"
          >
            <div className="aspect-[4/3] relative bg-gray-800 overflow-hidden">
              <Image
                src={photo.imageUrl}
                alt={photo.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority={index < 6} // Only prioritize loading for the first 6 images
                unoptimized={true}
                onError={(e) => {
                  // Fallback to a default image on error
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://picsum.photos/id/1/1200/800';
                }}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <h3 className="text-lg font-semibold text-white">{photo.title}</h3>
              <p className="text-sm text-gray-300">{photo.category}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* No results message */}
      {filteredPhotos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-xl">No photos found in this category</p>
        </div>
      )}
      
      {/* Lightbox */}
      {lightboxOpen && filteredPhotos.length > 0 && (
        <Lightbox
          mainSrc={filteredPhotos[photoIndex].imageUrl}
          nextSrc={filteredPhotos[(photoIndex + 1) % filteredPhotos.length].imageUrl}
          prevSrc={filteredPhotos[(photoIndex + filteredPhotos.length - 1) % filteredPhotos.length].imageUrl}
          onCloseRequest={() => setLightboxOpen(false)}
          onMovePrevRequest={() => 
            setPhotoIndex((photoIndex + filteredPhotos.length - 1) % filteredPhotos.length)
          }
          onMoveNextRequest={() => 
            setPhotoIndex((photoIndex + 1) % filteredPhotos.length)
          }
          imageTitle={filteredPhotos[photoIndex].title}
          imageCaption={filteredPhotos[photoIndex].description}
        />
      )}
    </div>
  );
};

export default PortfolioScreen;
