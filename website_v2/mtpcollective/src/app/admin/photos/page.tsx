'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PhotoUpload } from '@/components/photos/PhotoUpload';
import { AdminPhotoGrid } from '@/components/photos/AdminPhotoGrid';
import { Photo } from '@/types/photo';

interface Category {
  id: string;
  name: string;
}

export default function AdminPhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    }
  }, []);

  const fetchPhotos = useCallback(async () => {
    try {
      const url = selectedCategory ? `/api/photos?category=${selectedCategory}` : '/api/photos';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch photos');
      const data = await response.json();
      setPhotos(data.photos || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch photos');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchCategories();
    fetchPhotos();
  }, [fetchCategories, fetchPhotos]);

  const handleUploadComplete = async () => {
    try {
      await fetchPhotos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save photo');
    }
  };

  const handlePhotoUpdated = async () => {
    try {
      await fetchPhotos();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh photos');
    }
  };

  const handlePhotoDeleted = async () => {
    try {
      await fetchPhotos();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh photos');
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    fetchPhotos();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Photo Management</h1>
        <p className="text-gray-400 mt-1">Upload, organize, and manage your photography portfolio</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">Upload New Photo</h2>
        <PhotoUpload onUploadComplete={handleUploadComplete} />
      </div>

      {/* Filter Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Your Photos</h2>
          <div className="flex items-center space-x-4">
            <label htmlFor="category" className="text-sm font-medium text-gray-200">
              Filter by Category:
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {photos.length > 0 ? (
          <AdminPhotoGrid 
            photos={photos} 
            onPhotoUpdated={handlePhotoUpdated}
            onPhotoDeleted={handlePhotoDeleted}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No photos found</div>
            <p className="text-gray-500">
              {selectedCategory ? 'No photos in this category yet.' : 'Upload your first photo to get started!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 