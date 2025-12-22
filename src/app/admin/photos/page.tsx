'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PhotoUpload } from '@/components/photos/PhotoUpload';
import { BulkPhotoUpload } from '@/components/photos/BulkPhotoUpload';
import { AdminPhotoGrid } from '@/components/photos/AdminPhotoGrid';
import { BulkEditModal } from '@/components/photos/BulkEditModal';
import { Photo } from '@/types/photo';
import { 
  PhotoIcon, 
  RectangleGroupIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  CloudArrowUpIcon,
  PencilSquareIcon,
  QueueListIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
}

interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
  date?: string;
  location?: string;
}

type AdminTab = 'upload' | 'edit' | 'order';

export default function AdminPhotos() {
  const [activeTab, setActiveTab] = useState<AdminTab>('edit');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
  
  // Bulk edit state
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  
  // Order photos state
  const [orderCategory, setOrderCategory] = useState<string>('');
  const [orderedPhotos, setOrderedPhotos] = useState<Photo[]>([]);
  const [orderIsDirty, setOrderIsDirty] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      // Fetch hierarchical categories
      const response = await fetch('/api/categories?hierarchy=true');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
      
      // Create a flat list for dropdowns
      const flat: Category[] = [];
      data.forEach((parent: Category) => {
        flat.push(parent);
        if (parent.children) {
          parent.children.forEach((child: Category) => {
            flat.push({ ...child, name: `  └ ${child.name}` });
          });
        }
      });
      setFlatCategories(flat);
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

  // Fetch photos for ordering (by specific category)
  const fetchOrderPhotos = useCallback(async (categoryId: string) => {
    if (!categoryId) {
      setOrderedPhotos([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/categories/${categoryId}/photos`);
      if (!response.ok) throw new Error('Failed to fetch category photos');
      const data = await response.json();
      setOrderedPhotos(data.photos || data);
      setOrderIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch photos for ordering');
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchEvents();
    fetchPhotos();
  }, [fetchCategories, fetchEvents, fetchPhotos]);

  useEffect(() => {
    if (activeTab === 'order' && orderCategory) {
      fetchOrderPhotos(orderCategory);
    }
  }, [activeTab, orderCategory, fetchOrderPhotos]);

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
  };

  const handleEventChange = (eventId: string) => {
    setSelectedEvent(eventId);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedEvent('');
  };

  // Bulk selection handlers
  const toggleBulkSelectMode = () => {
    setBulkSelectMode(!bulkSelectMode);
    if (bulkSelectMode) {
      setSelectedPhotoIds(new Set());
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const selectAllPhotos = () => {
    setSelectedPhotoIds(new Set(photos.map(p => p.id)));
  };

  const deselectAllPhotos = () => {
    setSelectedPhotoIds(new Set());
  };

  const handleBulkEditComplete = async () => {
    setShowBulkEditModal(false);
    setSelectedPhotoIds(new Set());
    setBulkSelectMode(false);
    await fetchPhotos();
  };

  // Order photos handlers
  const moveOrderPhoto = (index: number, direction: -1 | 1) => {
    setOrderedPhotos(prev => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[newIndex];
      next[newIndex] = tmp;
      return next;
    });
    setOrderIsDirty(true);
  };

  const moveOrderPhotoToTop = (index: number) => {
    setOrderedPhotos(prev => {
      if (index <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
    setOrderIsDirty(true);
  };

  const moveOrderPhotoToBottom = (index: number) => {
    setOrderedPhotos(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.push(item);
      return next;
    });
    setOrderIsDirty(true);
  };

  const saveCategoryOrdering = async () => {
    try {
      if (!orderCategory) {
        toast.error('Please select a category first');
        return;
      }
      
      const photoOrder = orderedPhotos.map((p, idx) => ({
        photoId: p.id,
        position: idx
      }));
      
      const res = await fetch(`/api/categories/${orderCategory}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: photoOrder }),
      });
      
      if (!res.ok) throw new Error('Failed to save ordering');
      toast.success('Category ordering saved');
      setOrderIsDirty(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save ordering');
    }
  };

  const getCategoryName = (id: string): string => {
    const flat = flatCategories.find(c => c.id === id);
    return flat?.name?.replace('  └ ', '') || 'Unknown';
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            <CloudArrowUpIcon className="w-5 h-5" />
            Upload
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'edit'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            <PencilSquareIcon className="w-5 h-5" />
            Edit Photos
          </button>
          <button
            onClick={() => setActiveTab('order')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'order'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            <QueueListIcon className="w-5 h-5" />
            Order Photos
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'upload' && (
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
      )}

      {activeTab === 'edit' && (
        <div className="bg-gray-800 rounded-lg p-6">
          {/* Filter & Bulk Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="category" className="text-sm font-medium text-gray-200">
                  Category:
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="">All photos</option>
                  {flatCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="event" className="text-sm font-medium text-gray-200">
                  Event:
                </label>
                <select
                  id="event"
                  value={selectedEvent}
                  onChange={(e) => handleEventChange(e.target.value)}
                  className="rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="">All events</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                      {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              {(selectedCategory || selectedEvent) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleBulkSelectMode}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  bulkSelectMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <CheckIcon className="w-4 h-4" />
                {bulkSelectMode ? 'Exit Bulk Mode' : 'Bulk Select'}
              </button>
              
              {bulkSelectMode && (
                <>
                  <button
                    onClick={selectAllPhotos}
                    className="px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllPhotos}
                    className="px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Deselect All
                  </button>
                  {selectedPhotoIds.size > 0 && (
                    <button
                      onClick={() => setShowBulkEditModal(true)}
                      className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors"
                    >
                      Edit {selectedPhotoIds.size} Selected
                    </button>
                  )}
                </>
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
                    Category: {getCategoryName(selectedCategory)}
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

          {/* Photo Grid */}
          {photos.length > 0 ? (
            <AdminPhotoGrid 
              photos={photos} 
              onPhotoUpdated={handlePhotoUpdated}
              onPhotoDeleted={handlePhotoDeleted}
              bulkSelectMode={bulkSelectMode}
              selectedPhotoIds={selectedPhotoIds}
              onPhotoSelect={togglePhotoSelection}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No photos found</div>
              <p className="text-gray-500">
                {selectedCategory || selectedEvent 
                  ? 'No photos match your filters.' 
                  : 'Upload your first photo to get started!'}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'order' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Order Photos by Category</h2>
            <p className="text-sm text-gray-400">
              Set the display order for photos within each category or subcategory. 
              The &quot;All Photos&quot; view order is automatically generated based on category order.
            </p>
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <label htmlFor="orderCategory" className="block text-sm font-medium text-gray-200 mb-2">
              Select Category to Order:
            </label>
            <select
              id="orderCategory"
              value={orderCategory}
              onChange={(e) => setOrderCategory(e.target.value)}
              className="w-full max-w-md rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">-- Select a category --</option>
              {flatCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ordering UI */}
          {orderCategory && orderedPhotos.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-300">
                  {orderedPhotos.length} photos in &quot;{getCategoryName(orderCategory)}&quot;
                </div>
                <button
                  onClick={saveCategoryOrdering}
                  disabled={!orderIsDirty}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    orderIsDirty
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Save Ordering
                </button>
              </div>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {orderedPhotos.map((photo, idx) => (
                  <div key={photo.id} className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
                    <div className="text-gray-500 text-sm font-mono w-8 text-center">
                      {idx + 1}
                    </div>
                    <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <Image 
                        src={photo.thumbnail || photo.url} 
                        alt={photo.title} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div className="text-gray-200 text-sm flex-1 min-w-0">
                      <div className="truncate font-medium">{photo.title}</div>
                      {photo.categories && photo.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {photo.categories.slice(0, 3).map((cat) => (
                            <span key={cat.id} className="text-xs bg-gray-600 px-1.5 py-0.5 rounded text-gray-300">
                              {cat.name}
                            </span>
                          ))}
                          {photo.categories.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{photo.categories.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => moveOrderPhotoToTop(idx)} 
                        className="p-1.5 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                        disabled={idx === 0}
                        title="Move to top"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => moveOrderPhoto(idx, -1)} 
                        className="p-1.5 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                        disabled={idx === 0}
                        title="Move up"
                      >
                        <ArrowUpIcon className="w-4 h-4 text-white" />
                      </button>
                      <button 
                        onClick={() => moveOrderPhoto(idx, 1)} 
                        className="p-1.5 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                        disabled={idx === orderedPhotos.length - 1}
                        title="Move down"
                      >
                        <ArrowDownIcon className="w-4 h-4 text-white" />
                      </button>
                      <button 
                        onClick={() => moveOrderPhotoToBottom(idx)} 
                        className="p-1.5 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                        disabled={idx === orderedPhotos.length - 1}
                        title="Move to bottom"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7M19 5l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {orderIsDirty && (
                <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                  <p className="text-sm text-yellow-300">
                    You have unsaved changes. Click &quot;Save Ordering&quot; to apply.
                  </p>
                </div>
              )}
            </div>
          ) : orderCategory ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No photos in this category</div>
              <p className="text-gray-500">Add photos to this category to set their order.</p>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
              <QueueListIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <div className="text-gray-400 text-lg mb-2">Select a category to begin</div>
              <p className="text-gray-500">Choose a category or subcategory from the dropdown above to order its photos.</p>
            </div>
          )}
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <BulkEditModal
          photoIds={Array.from(selectedPhotoIds)}
          onClose={() => setShowBulkEditModal(false)}
          onComplete={handleBulkEditComplete}
        />
      )}
    </div>
  );
}
