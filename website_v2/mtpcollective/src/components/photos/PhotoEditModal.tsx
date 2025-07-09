'use client';

import React, { useState, useEffect } from 'react';
import { Photo } from '@/types/photo';

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/tags')
        ]);

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }

        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          setTags(tagsData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

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

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Categories
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center space-x-2 text-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
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