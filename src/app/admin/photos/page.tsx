'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PhotoUpload } from '@/components/photos/PhotoUpload';
import { BulkPhotoUpload } from '@/components/photos/BulkPhotoUpload';
import { AdminPhotoGrid } from '@/components/photos/AdminPhotoGrid';
import { Photo } from '@/types/photo';
import { PhotoIcon, RectangleGroupIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
  date?: string;
  location?: string;
}

export default function AdminPhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');

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

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    }
  }, []);

  const fetchPhotos = useCallback(async () => {
    try {
      let url = '/api/photos';
      const params = new URLSearchParams();
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (selectedEvent) {
        params.append('event', selectedEvent);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch photos');
      const data = await response.json();
      setPhotos(data.photos || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch photos');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedEvent]);

  useEffect(() => {
    fetchCategories();
    fetchEvents();
    fetchPhotos();
  }, [fetchCategories, fetchEvents, fetchPhotos]);

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
    // fetchPhotos will be called automatically via useEffect when selectedCategory changes
  };

  const handleEventChange = (eventId: string) => {
    setSelectedEvent(eventId);
    // fetchPhotos will be called automatically via useEffect when selectedEvent changes
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedEvent('');
  };

  const moveAllPhoto = (index: number, direction: -1 | 1) => {
    if (selectedCategory || selectedEvent) return; // only in All Photos view
    setPhotos(prev => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[newIndex];
      next[newIndex] = tmp;
      return next;
    });
  };

  const moveAllPhotoToTop = (index: number) => {
    if (selectedCategory || selectedEvent) return;
    setPhotos(prev => {
      if (index <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  };

  const saveGlobalOrdering = async () => {
    try {
      if (selectedCategory || selectedEvent) {
        toast.error('Global ordering only applies when viewing All Photos');
        return;
      }
      const orderedPhotoIds = photos.map(p => p.id);
      const res = await fetch('/api/photos/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedPhotoIds }),
      });
      if (!res.ok) throw new Error('Failed to save ordering');
      toast.success('All Photos ordering saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save ordering');
    }
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Upload Photos</h2>
          
          {/* Upload Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Upload Mode:</span>
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setUploadMode('single')}
                className={`flex items-center px-3 py-1 rounded-md text-sm transition-colors ${
                  uploadMode === 'single'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <PhotoIcon className="w-4 h-4 mr-1" />
                Single
              </button>
              <button
                onClick={() => setUploadMode('bulk')}
                className={`flex items-center px-3 py-1 rounded-md text-sm transition-colors ${
                  uploadMode === 'bulk'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <RectangleGroupIcon className="w-4 h-4 mr-1" />
                Bulk
              </button>
            </div>
          </div>
        </div>

        {/* Upload Component */}
        {uploadMode === 'single' ? (
          <div>
            <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <h3 className="font-medium text-blue-300 mb-2">Single Photo Upload</h3>
              <p className="text-sm text-blue-200">Upload one photo at a time with individual settings for each photo.</p>
            </div>
            <PhotoUpload onUploadComplete={handleUploadComplete} />
          </div>
        ) : (
          <div>
            <div className="mb-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <h3 className="font-medium text-purple-300 mb-2">Bulk Photo Upload</h3>
              <p className="text-sm text-purple-200">Upload multiple photos at once and associate them with events. Perfect for event photography!</p>
              <div className="mt-2 text-xs text-purple-200 space-y-1">
                <div>• Select multiple image files</div>
                <div>• Associate all photos with an event</div>
                <div>• Apply categories and tags to all photos</div>
                <div>• Individual titles and descriptions for each photo</div>
              </div>
            </div>
            <BulkPhotoUpload onUploadComplete={handleUploadComplete} />
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Your Photos</h2>
          <div className="flex items-center space-x-4">
            {/* Category Filter */}
            <label htmlFor="category" className="text-sm font-medium text-gray-200">
              Category:
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

            {/* Event Filter */}
            <label htmlFor="event" className="text-sm font-medium text-gray-200">
              Event:
            </label>
            <select
              id="event"
              value={selectedEvent}
              onChange={(e) => handleEventChange(e.target.value)}
              className="rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                  {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                </option>
              ))}
            </select>

            {/* Clear Filters Button */}
            {(selectedCategory || selectedEvent) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedCategory || selectedEvent) && (
          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>Active filters:</span>
              {selectedCategory && (
                <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full">
                  Category: {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
              {selectedEvent && (
                <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded-full">
                  Event: {events.find(e => e.id === selectedEvent)?.name}
                </span>
              )}
            </div>
          </div>
        )}

        {!selectedCategory && !selectedEvent && photos.length > 0 ? (
          <div>
            <div className="text-sm text-gray-300 mb-2">All Photos ordering (top to bottom). Use Up/Down, then Save.</div>
            <div className="space-y-2">
              {photos.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 bg-gray-700 rounded p-2">
                  <div className="relative w-12 h-12 rounded overflow-hidden">
                    <Image src={p.thumbnail || p.url} alt={p.title} fill className="object-cover" />
                  </div>
                  <div className="text-gray-200 text-sm flex-1 truncate">{p.title}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => moveAllPhoto(idx, -1)} className="p-1 bg-gray-600 rounded disabled:opacity-50" disabled={idx === 0}>
                      <ArrowUpIcon className="w-4 h-4 text-white" />
                    </button>
                    <button onClick={() => moveAllPhoto(idx, 1)} className="p-1 bg-gray-600 rounded disabled:opacity-50" disabled={idx === photos.length - 1}>
                      <ArrowDownIcon className="w-4 h-4 text-white" />
                    </button>
                    <button onClick={() => moveAllPhotoToTop(idx)} className="px-2 py-1 bg-gray-600 rounded text-xs text-white disabled:opacity-50" disabled={idx === 0}>
                      Top
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3">
              <button onClick={saveGlobalOrdering} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Ordering</button>
            </div>
          </div>
        ) : photos.length > 0 ? (
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