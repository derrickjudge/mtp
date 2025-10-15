'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface Photo {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  position?: number;
  is_top_selection?: boolean;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [categoryPhotos, setCategoryPhotos] = useState<Record<string, Photo[]>>({});
  const [topPhotoIds, setTopPhotoIds] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
      // also fetch curated photos per category
      const photosByCategory: Record<string, Photo[]> = {};
      const tops: Record<string, string[]> = {};
      for (const cat of data) {
        const res = await fetch(`/api/categories/${cat.id}/photos`);
        if (res.ok) {
          const json = await res.json();
          photosByCategory[cat.id] = json.photos || [];
          tops[cat.id] = (json.photos || []).filter((p: Photo) => p.is_top_selection).map((p: Photo) => p.id);
        }
      }
      setCategoryPhotos(photosByCategory);
      setTopPhotoIds(tops);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const movePhoto = (categoryId: string, index: number, direction: -1 | 1) => {
    setCategoryPhotos(prev => {
      const current = prev[categoryId] || [];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= current.length) return prev;
      const next = [...current];
      const tmp = next[index];
      next[index] = next[newIndex];
      next[newIndex] = tmp;
      return { ...prev, [categoryId]: next };
    });
  };

  const toggleTop = (categoryId: string, photoId: string) => {
    setTopPhotoIds(prev => {
      const set = new Set(prev[categoryId] || []);
      if (set.has(photoId)) set.delete(photoId); else set.add(photoId);
      return { ...prev, [categoryId]: Array.from(set) };
    });
  };

  const saveCuration = async (categoryId: string) => {
    try {
      const orderedPhotoIds = (categoryPhotos[categoryId] || []).map(p => p.id);
      const res = await fetch(`/api/categories/${categoryId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedPhotoIds, topPhotoIds: topPhotoIds[categoryId] || [] }),
      });
      if (!res.ok) throw new Error('Failed to save ordering');
      toast.success('Category photo ordering saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save ordering');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsCreating(true);

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save category');
      }

      const category = await response.json();
      
      if (editingCategory) {
        setCategories(prev => prev.map(cat => cat.id === category.id ? category : cat));
        toast.success('Category updated successfully');
        setEditingCategory(null);
      } else {
        setCategories(prev => [...prev, category]);
        toast.success('Category created successfully');
      }

      setFormData({ name: '', description: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete category');
      }

      setCategories(prev => prev.filter(cat => cat.id !== category.id));
      toast.success('Category deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
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
        <h1 className="text-2xl font-bold text-white">Category Management</h1>
        <p className="text-gray-400 mt-1">Manage photo categories for your portfolio</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create/Edit Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Concerts, Nature, Automotive"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Optional description for this category"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isCreating ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">Existing Categories</h2>
          
          {categories.length > 0 ? (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{category.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{category.slug}</p>
                      {category.description && (
                        <p className="text-sm text-gray-300 mt-2">{category.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                      {/* Curation Controls */}
                      {(categoryPhotos[category.id] || []).length > 0 && (
                        <div className="mt-4 space-y-2">
                          {(categoryPhotos[category.id] || []).map((p, idx) => (
                            <div key={p.id} className="flex items-center gap-3 bg-gray-800 rounded p-2">
                              <div className="relative w-10 h-10 rounded overflow-hidden">
                                <Image src={p.thumbnail || p.url} alt={p.title} fill className="object-cover" />
                              </div>
                              <div className="flex-1 text-sm text-gray-200 truncate">{p.title}</div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => movePhoto(category.id, idx, -1)} className="px-2 py-1 text-xs bg-gray-600 rounded text-white">Up</button>
                                <button onClick={() => movePhoto(category.id, idx, 1)} className="px-2 py-1 text-xs bg-gray-600 rounded text-white">Down</button>
                                <label className="flex items-center gap-1 text-xs text-gray-200">
                                  <input type="checkbox" checked={(topPhotoIds[category.id] || []).includes(p.id)} onChange={() => toggleTop(category.id, p.id)} className="rounded" />
                                  Top
                                </label>
                              </div>
                            </div>
                          ))}
                          <div className="pt-1">
                            <button onClick={() => saveCuration(category.id)} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Ordering</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(category)}
                        className="px-3 py-1 text-sm text-blue-300 bg-blue-600/20 rounded hover:bg-blue-600/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="px-3 py-1 text-sm text-red-300 bg-red-600/20 rounded hover:bg-red-600/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">No categories yet</div>
              <p className="text-gray-500">Create your first category to organize your photos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 