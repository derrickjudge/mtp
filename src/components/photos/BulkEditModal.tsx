'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
  isSignatureShots?: boolean;
}

interface BulkEditModalProps {
  photoIds: string[];
  onClose: () => void;
  onComplete: () => void;
}

type EditMode = 'add' | 'remove' | 'set';

export function BulkEditModal({ photoIds, onClose, onComplete }: BulkEditModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState<EditMode>('add');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?hierarchy=true');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        
        // Mark Signature Shots categories
        const processedData = data.map((parent: Category) => ({
          ...parent,
          children: parent.children?.map((child: Category) => ({
            ...child,
            isSignatureShots: child.name.toLowerCase().includes('signature shots')
          }))
        }));
        
        setCategories(processedData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedCategoryIds.size === 0) {
      toast.error('Please select at least one category');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/photos/bulk-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoIds,
          categoryIds: Array.from(selectedCategoryIds),
          mode: editMode
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update photos');
      }

      const modeText = editMode === 'add' ? 'added to' : editMode === 'remove' ? 'removed from' : 'set for';
      toast.success(`Categories ${modeText} ${photoIds.length} photos`);
      onComplete();
    } catch (error) {
      console.error('Error updating photos:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update photos');
    } finally {
      setIsSaving(false);
    }
  };

  const getModeDescription = () => {
    switch (editMode) {
      case 'add':
        return 'Add selected categories to all chosen photos (keeps existing categories)';
      case 'remove':
        return 'Remove selected categories from all chosen photos';
      case 'set':
        return 'Replace all categories on chosen photos with selected categories';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Bulk Edit Categories</h2>
              <p className="text-sm text-gray-400 mt-1">
                Editing {photoIds.length} photo{photoIds.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <>
              {/* Edit Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-200 mb-3">
                  Edit Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setEditMode('add')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      editMode === 'add'
                        ? 'border-green-500 bg-green-500/20 text-green-300'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium">Add</div>
                    <div className="text-xs mt-1 opacity-80">Keep existing</div>
                  </button>
                  <button
                    onClick={() => setEditMode('remove')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      editMode === 'remove'
                        ? 'border-red-500 bg-red-500/20 text-red-300'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium">Remove</div>
                    <div className="text-xs mt-1 opacity-80">Remove only</div>
                  </button>
                  <button
                    onClick={() => setEditMode('set')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      editMode === 'set'
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium">Replace</div>
                    <div className="text-xs mt-1 opacity-80">Replace all</div>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {getModeDescription()}
                </p>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">
                  Select Categories
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-600 rounded-lg p-4 bg-gray-700/50">
                  <div className="space-y-3">
                    {categories.map((parentCategory) => (
                      <div key={parentCategory.id} className="space-y-2">
                        {/* Parent Category */}
                        <label className="flex items-center space-x-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.has(parentCategory.id)}
                            onChange={() => handleCategoryToggle(parentCategory.id)}
                            className="w-5 h-5 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                          />
                          <span className="text-gray-200 font-semibold group-hover:text-white">
                            {parentCategory.name}
                          </span>
                        </label>
                        
                        {/* Subcategories */}
                        {parentCategory.children && parentCategory.children.length > 0 && (
                          <div className="ml-8 space-y-2">
                            {parentCategory.children.map((subCategory) => (
                              <label 
                                key={subCategory.id} 
                                className="flex items-center space-x-3 cursor-pointer group"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCategoryIds.has(subCategory.id)}
                                  onChange={() => handleCategoryToggle(subCategory.id)}
                                  className={`w-5 h-5 rounded border-gray-500 bg-gray-600 focus:ring-offset-gray-800 ${
                                    subCategory.isSignatureShots 
                                      ? 'text-yellow-500 focus:ring-yellow-500' 
                                      : 'text-blue-500 focus:ring-blue-500'
                                  }`}
                                />
                                <span className="flex items-center gap-2 text-gray-300 group-hover:text-white">
                                  {subCategory.isSignatureShots && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-yellow-400">
                                      <path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.415-.772 1.736 0l1.83 4.401 4.705.461c.825.08.928 1.187.241 1.757l-3.645 3.105 1.107 4.547c.197.809-.607 1.43-1.332.919L10 15.574l-4.007 2.39c-.725.511-1.529-.11-1.332-.919l1.107-4.547-3.645-3.105c-.687-.57-.584-1.677.241-1.757l4.705-.461 1.83-4.401Z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  {subCategory.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Summary */}
              {selectedCategoryIds.size > 0 && (
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-300">
                    <span className="font-medium">Selected categories:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.from(selectedCategoryIds).map(id => {
                        const cat = categories.find(c => c.id === id) || 
                                    categories.flatMap(c => c.children || []).find(c => c.id === id);
                        return cat ? (
                          <span 
                            key={id} 
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              cat.isSignatureShots
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {cat.isSignatureShots && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.415-.772 1.736 0l1.83 4.401 4.705.461c.825.08.928 1.187.241 1.757l-3.645 3.105 1.107 4.547c.197.809-.607 1.43-1.332.919L10 15.574l-4.007 2.39c-.725.511-1.529-.11-1.332-.919l1.107-4.547-3.645-3.105c-.687-.57-.584-1.677.241-1.757l4.705-.461 1.83-4.401Z" clipRule="evenodd" />
                              </svg>
                            )}
                            {cat.name}
                            <button
                              onClick={() => handleCategoryToggle(id)}
                              className="ml-1 hover:text-white"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || selectedCategoryIds.size === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSaving || selectedCategoryIds.size === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : editMode === 'remove'
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {isSaving ? 'Saving...' : `${editMode === 'add' ? 'Add' : editMode === 'remove' ? 'Remove' : 'Set'} Categories`}
          </button>
        </div>
      </div>
    </div>
  );
}

