'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  showInNav?: boolean;
  parentId?: string | null;
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
    showInNav: true,
    parentId: '' as string | null,
  });
  const [categoryPhotos, setCategoryPhotos] = useState<Record<string, Photo[]>>({});
  const [topPhotoIds, setTopPhotoIds] = useState<Record<string, string[]>>({});

  // Organize categories into hierarchy
  const { parentCategories, subcategoriesByParent } = useMemo(() => {
    const parents = categories.filter(c => !c.parentId);
    const subsByParent: Record<string, Category[]> = {};
    
    parents.forEach(parent => {
      subsByParent[parent.id] = categories.filter(c => c.parentId === parent.id);
    });
    
    return { parentCategories: parents, subcategoriesByParent: subsByParent };
  }, [categories]);

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

      const payload = {
        name: formData.name,
        description: formData.description,
        showInNav: formData.showInNav,
        parentId: formData.parentId || null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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

      resetForm();
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
      showInNav: category.showInNav !== false,
      parentId: category.parentId || '',
    });
  };

  const handleDelete = async (category: Category) => {
    // Check if this is a parent with children
    const hasChildren = categories.some(c => c.parentId === category.id);
    if (hasChildren) {
      toast.error('Cannot delete a parent category with subcategories. Delete subcategories first.');
      return;
    }

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

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', showInNav: true, parentId: '' });
  };

  const getParentName = (parentId: string | null | undefined): string => {
    if (!parentId) return '';
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : '';
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
        <p className="text-gray-400 mt-1">Manage photo categories and subcategories for your portfolio</p>
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
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                placeholder="e.g., Music, Action Shots, Rugby"
                required
              />
            </div>

            <div>
              <label htmlFor="parentId" className="block text-sm font-medium text-gray-200 mb-2">
                Parent Category
              </label>
              <select
                id="parentId"
                value={formData.parentId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value || null }))}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              >
                <option value="">None (This is a parent category)</option>
                {parentCategories
                  .filter(p => p.id !== editingCategory?.id) // Can't be own parent
                  .map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))
                }
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Leave empty to create a parent category, or select a parent to create a subcategory
              </p>
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
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                placeholder="Optional description for this category"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showInNav"
                checked={formData.showInNav}
                onChange={(e) => setFormData(prev => ({ ...prev, showInNav: e.target.checked }))}
                className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="showInNav" className="text-sm font-medium text-gray-200">
                Show in Navigation
              </label>
            </div>

            <div className="flex gap-3 pt-2">
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
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className="bg-gray-800 rounded-lg p-6 max-h-[80vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">Category Hierarchy</h2>
          
          {parentCategories.length > 0 ? (
            <div className="space-y-4">
              {parentCategories.map((parent) => (
                <div key={parent.id} className="bg-gray-700 rounded-lg overflow-hidden">
                  {/* Parent Category */}
                  <div className="p-4 border-b border-gray-600">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white text-lg">{parent.name}</h3>
                          {parent.showInNav === false && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-600/30 text-yellow-300 rounded">
                              Hidden
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">{parent.slug}</p>
                        {parent.description && (
                          <p className="text-sm text-gray-300 mt-2 line-clamp-2">{parent.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(parent)}
                          className="px-3 py-1 text-sm text-blue-300 bg-blue-600/20 rounded hover:bg-blue-600/30"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(parent)}
                          className="px-3 py-1 text-sm text-red-300 bg-red-600/20 rounded hover:bg-red-600/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subcategories */}
                  {subcategoriesByParent[parent.id]?.length > 0 && (
                    <div className="bg-gray-750 divide-y divide-gray-600">
                      {subcategoriesByParent[parent.id].map((sub) => (
                        <div key={sub.id} className="p-3 pl-8 bg-gray-800/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">└</span>
                                <h4 className="font-medium text-gray-100">{sub.name}</h4>
                                {sub.showInNav === false && (
                                  <span className="px-2 py-0.5 text-xs bg-yellow-600/30 text-yellow-300 rounded">
                                    Hidden
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 ml-5">{sub.slug}</p>
                              {sub.description && (
                                <p className="text-sm text-gray-400 mt-1 ml-5 line-clamp-1">{sub.description}</p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEdit(sub)}
                                className="px-2 py-1 text-xs text-blue-300 bg-blue-600/20 rounded hover:bg-blue-600/30"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(sub)}
                                className="px-2 py-1 text-xs text-red-300 bg-red-600/20 rounded hover:bg-red-600/30"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* No subcategories message */}
                  {(!subcategoriesByParent[parent.id] || subcategoriesByParent[parent.id].length === 0) && (
                    <div className="p-3 pl-8 text-sm text-gray-500 italic">
                      No subcategories yet
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">No categories yet</div>
              <p className="text-gray-500">Create your first parent category to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Curation Section (for categories with photos) */}
      {categories.some(cat => (categoryPhotos[cat.id] || []).length > 0) && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">Photo Curation by Category</h2>
          <div className="space-y-6">
            {categories.filter(cat => (categoryPhotos[cat.id] || []).length > 0).map((category) => (
              <div key={category.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-medium text-white">{category.name}</h3>
                  {category.parentId && (
                    <span className="text-xs text-gray-400">
                      (in {getParentName(category.parentId)})
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {(categoryPhotos[category.id] || []).map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-3 bg-gray-800 rounded p-2">
                      <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                        <Image src={p.thumbnail || p.url} alt={p.title} fill className="object-cover" />
                      </div>
                      <div className="flex-1 text-sm text-gray-200 truncate">{p.title}</div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => movePhoto(category.id, idx, -1)} 
                          className="px-2 py-1 text-xs bg-gray-600 rounded text-white hover:bg-gray-500 disabled:opacity-50"
                          disabled={idx === 0}
                        >
                          ↑
                        </button>
                        <button 
                          onClick={() => movePhoto(category.id, idx, 1)} 
                          className="px-2 py-1 text-xs bg-gray-600 rounded text-white hover:bg-gray-500 disabled:opacity-50"
                          disabled={idx === (categoryPhotos[category.id] || []).length - 1}
                        >
                          ↓
                        </button>
                        <label className="flex items-center gap-1 text-xs text-gray-200">
                          <input 
                            type="checkbox" 
                            checked={(topPhotoIds[category.id] || []).includes(p.id)} 
                            onChange={() => toggleTop(category.id, p.id)} 
                            className="rounded border-gray-500 bg-gray-600" 
                          />
                          Top
                        </label>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <button 
                      onClick={() => saveCuration(category.id)} 
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Save Ordering
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
