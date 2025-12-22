'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Photo } from '@/types/photo';
import { PhotoEditModal } from './PhotoEditModal';

interface AdminPhotoGridProps {
  photos: Photo[];
  onPhotoUpdated: () => void;
  onPhotoDeleted: () => void;
  bulkSelectMode?: boolean;
  selectedPhotoIds?: Set<string>;
  onPhotoSelect?: (photoId: string) => void;
}

export function AdminPhotoGrid({ 
  photos, 
  onPhotoUpdated, 
  onPhotoDeleted,
  bulkSelectMode = false,
  selectedPhotoIds = new Set(),
  onPhotoSelect
}: AdminPhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<Photo | null>(null);


  const handleDelete = async (photo: Photo) => {
    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      onPhotoDeleted();
      setDeletingPhoto(null);
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  };

  const handleCardClick = (photo: Photo) => {
    if (bulkSelectMode && onPhotoSelect) {
      onPhotoSelect(photo.id);
    } else {
      setSelectedPhoto(photo);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.map((photo) => {
          const isSelected = selectedPhotoIds.has(photo.id);
          
          return (
            <div
              key={photo.id}
              className={`relative group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ${
                bulkSelectMode 
                  ? isSelected 
                    ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-gray-800' 
                    : 'cursor-pointer hover:ring-2 hover:ring-gray-500'
                  : ''
              }`}
            >
              {/* Selection Checkbox (Bulk Mode) */}
              {bulkSelectMode && (
                <div 
                  className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'bg-gray-800/80 border-gray-400 hover:border-blue-400'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPhotoSelect?.(photo.id);
                  }}
                >
                  {isSelected && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )}
              
              <div 
                className="aspect-square relative cursor-pointer" 
                onClick={() => handleCardClick(photo)}
              >
                <Image
                  src={photo.thumbnail || photo.url}
                  alt={photo.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              
              {/* Admin Controls - Hidden in bulk mode */}
              {!bulkSelectMode && (
                <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPhoto(photo);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
                    title="Edit photo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingPhoto(photo);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors"
                    title="Delete photo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Photo Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black to-transparent">
                <h3 className="text-lg font-semibold truncate">{photo.title}</h3>
                {photo.description && (
                  <p className="text-sm opacity-90 line-clamp-2">{photo.description}</p>
                )}
                
                {/* Categories */}
                {photo.categories && photo.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {photo.categories.map((category) => (
                      <span key={category.id} className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                        {category.name}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Events */}
                {photo.events && photo.events.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {photo.events.map((event) => (
                      <span key={event.id} className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs">
                        📅 {event.name}
                        {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center space-x-2 mt-2">
                  {photo.featured && (
                    <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-medium">
                      Featured
                    </span>
                  )}
                  {!photo.published && (
                    <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Draft
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-size Photo Modal */}
      {selectedPhoto && !bulkSelectMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-7xl max-h-[90vh] mx-4">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full h-[80vh] max-w-6xl flex items-center justify-center">
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                width={1200}
                height={800}
                className="max-w-full max-h-full object-contain"
                priority
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent text-white">
              <h2 className="text-2xl font-bold mb-2">{selectedPhoto.title}</h2>
              {selectedPhoto.description && (
                <p className="text-lg opacity-90">{selectedPhoto.description}</p>
              )}
              
              {/* Categories */}
              {selectedPhoto.categories && selectedPhoto.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-sm font-medium text-gray-300">Categories:</span>
                  {selectedPhoto.categories.map((category) => (
                    <span key={category.id} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      {category.name}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Events */}
              {selectedPhoto.events && selectedPhoto.events.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-sm font-medium text-gray-300">Events:</span>
                  {selectedPhoto.events.map((event) => (
                    <span key={event.id} className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                      📅 {event.name}
                      {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Photo Modal */}
      {editingPhoto && (
        <PhotoEditModal
          photo={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSave={() => {
            onPhotoUpdated();
            setEditingPhoto(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Photo</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete &quot;{deletingPhoto.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeletingPhoto(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingPhoto)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
