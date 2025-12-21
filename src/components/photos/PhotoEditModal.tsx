'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Photo } from '@/types/photo';
import { StarIcon } from '@heroicons/react/24/solid';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  showInNav?: boolean;
  children?: Category[];
}

interface Tag {
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

interface PhotoEditModalProps {
  photo: Photo;
  onClose: () => void;
  onSave: () => void;
}

export function PhotoEditModal({ photo, onClose, onSave }: PhotoEditModalProps) {
  const [title, setTitle] = useState(photo.title);
  const [description, setDescription] = useState(photo.description || '');
  const [published, setPublished] = useState(photo.published);
  const [featured, setFeatured] = useState(photo.featured);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    photo.categories?.map(c => c.id) || []
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    photo.tags?.map(t => t.id) || []
  );
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(
    photo.events?.map(e => e.id) || []
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, tagsResponse, eventsResponse] = await Promise.all([
          fetch('/api/categories?hierarchy=true'),
          fetch('/api/tags'),
          fetch('/api/events')
        ]);

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }

        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          setTags(tagsData);
        }

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setEvents(eventsData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  // Check if a category is a Signature Shots subcategory
  const isSignatureShotsCategory = (category: Category): boolean => {
    return category.name.toLowerCase().includes('signature shots');
  };

  // Get all subcategory IDs from the hierarchical data
  const allCategories = useMemo(() => {
    const result: Category[] = [];
    categories.forEach(parent => {
      result.push(parent);
      if (parent.children) {
        result.push(...parent.children);
      }
    });
    return result;
  }, [categories]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          published,
          featured,
          categoryIds: selectedCategoryIds,
          tagIds: selectedTagIds,
          eventIds: selectedEventIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update photo');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleEventToggle = (eventId: string) => {
    setSelectedEventIds(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Edit Photo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-200 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter photo title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter photo description"
            />
          </div>

          {/* Categories - Hierarchical Display */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Categories & Subcategories
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Select categories for this photo. Click on &quot;Signature Shots&quot; to mark as a top selection for that category.
            </p>
            <div className="space-y-4 max-h-64 overflow-y-auto border border-gray-600 rounded-md p-3 bg-gray-700">
              {categories.map((parent) => (
                <div key={parent.id} className="space-y-2">
                  {/* Parent Category */}
                  <label className="flex items-center space-x-2 text-gray-100 font-medium">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(parent.id)}
                      onChange={() => handleCategoryToggle(parent.id)}
                      className="rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-base">{parent.name}</span>
                  </label>
                  
                  {/* Subcategories */}
                  {parent.children && parent.children.length > 0 && (
                    <div className="ml-6 space-y-1 border-l-2 border-gray-600 pl-3">
                      {parent.children.map((sub) => {
                        const isSignature = isSignatureShotsCategory(sub);
                        return (
                          <label 
                            key={sub.id} 
                            className={`flex items-center space-x-2 text-gray-200 ${
                              isSignature ? 'bg-yellow-600/20 rounded px-2 py-1 -ml-2' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCategoryIds.includes(sub.id)}
                              onChange={() => handleCategoryToggle(sub.id)}
                              className={`rounded border-gray-500 bg-gray-600 focus:ring-blue-500 ${
                                isSignature ? 'text-yellow-500' : 'text-blue-500'
                              }`}
                            />
                            {isSignature && (
                              <StarIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            )}
                            <span className={`text-sm ${isSignature ? 'text-yellow-300 font-medium' : ''}`}>
                              {sub.name.replace(`${parent.name}: `, '')}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Selected Categories Summary */}
            {selectedCategoryIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-gray-400">Selected:</span>
                {selectedCategoryIds.map(id => {
                  const cat = allCategories.find(c => c.id === id);
                  if (!cat) return null;
                  const isSignature = isSignatureShotsCategory(cat);
                  return (
                    <span 
                      key={id} 
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        isSignature 
                          ? 'bg-yellow-600/30 text-yellow-300' 
                          : 'bg-blue-600/30 text-blue-300'
                      }`}
                    >
                      {isSignature && <StarIcon className="w-3 h-3" />}
                      {cat.name}
                      <button
                        type="button"
                        onClick={() => handleCategoryToggle(id)}
                        className="hover:text-white ml-1"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Tags
              </label>
              <div className="grid grid-cols-2 gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center space-x-2 text-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span>{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {events.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Events
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-600 rounded-md p-3 bg-gray-700">
                <div className="space-y-2">
                  {events.map((event) => (
                    <label key={event.id} className="flex items-start space-x-2 text-gray-200">
                      <input
                        type="checkbox"
                        checked={selectedEventIds.includes(event.id)}
                        onChange={() => handleEventToggle(event.id)}
                        className="rounded border-gray-600 bg-gray-600 text-purple-500 focus:ring-purple-500 mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{event.name}</div>
                        {event.date && (
                          <div className="text-sm text-gray-400">
                            📅 {new Date(event.date).toLocaleDateString()}
                          </div>
                        )}
                        {event.location && (
                          <div className="text-sm text-gray-400">
                            📍 {event.location}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Select events this photo belongs to. You can select multiple events.
              </p>
            </div>
          )}

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="published" className="text-gray-200">
                Published (visible to public)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="featured" className="text-gray-200">
                Featured (highlight on homepage)
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !title.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
} 