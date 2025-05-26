'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { PhotoUpload } from '@/components/photos/PhotoUpload';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { Photo } from '@/types/photo';

interface Category {
  id: string;
  name: string;
}

export default function AdminPhotos() {
  const router = useRouter();
  const { data: session, status } = useSession();
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
    if (status === 'loading') return; // Still loading session

    if (status === 'unauthenticated' || !session?.user) {
      router.push('/admin/login');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      setError('You do not have permission to access this page');
      return;
    }

    // User is authenticated and has admin role
    fetchCategories();
    fetchPhotos();
  }, [status, session, router, fetchCategories, fetchPhotos]);

  const handleUploadComplete = async () => {
    try {
      await fetchPhotos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save photo');
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    fetchPhotos();
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Photo Management</h1>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign Out
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload New Photo</h2>
        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <PhotoUpload
          onUploadComplete={handleUploadComplete}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Photos</h2>
        {photos.length > 0 ? (
          <PhotoGrid photos={photos} />
        ) : (
          <p className="text-gray-500 text-center py-8">
            No photos uploaded yet. Upload your first photo above!
          </p>
        )}
      </div>
    </div>
  );
} 