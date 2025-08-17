'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Photo } from '@/types/photo';
import { PhotoEditModal } from './PhotoEditModal';

interface AdminPhotoGridProps {
  photos: Photo[];
  onPhotoUpdated: () => void;
  onPhotoDeleted: () => void;
}

export function AdminPhotoGrid({ photos, onPhotoUpdated, onPhotoDeleted }: AdminPhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<Photo | null>(null);
  const [useRegularImg, setUseRegularImg] = useState(false);


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

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
          >
            <div className="aspect-square relative cursor-pointer" onClick={() => {
              setSelectedPhoto(photo);
              setUseRegularImg(false); // Start with Next.js Image
            }}>
              <Image
                src={photo.thumbnail || photo.url}
                alt={photo.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
            
            {/* Admin Controls */}
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
        ))}
      </div>

      {/* Full-size Photo Modal */}
      {selectedPhoto && (
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
            <div className="relative w-full h-[80vh] max-w-6xl">
              {!useRegularImg ? (
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  priority
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  onError={(e) => {
                    console.error('Next.js Image failed to load:', selectedPhoto.url);
                    console.error('Error details:', e);
                    console.log('Automatically switching to regular img tag...');
                    setUseRegularImg(true);
                  }}
                  onLoad={() => {
                    console.log('Next.js Image loaded successfully:', selectedPhoto.url);
                  }}
                  onLoadingComplete={() => {
                    console.log('Next.js Image loading complete:', selectedPhoto.url);
                  }}
                />
              ) : (
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error('Regular img also failed to load:', selectedPhoto.url);
                    console.error('Regular img error details:', e);
                  }}
                  onLoad={() => {
                    console.log('Regular img loaded successfully:', selectedPhoto.url);
                  }}
                />
              )}
              
              {/* Debug and control overlay */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-90 text-white text-xs p-3 rounded max-w-md z-20">
                <p className="mb-1"><strong>URL:</strong> {selectedPhoto.url}</p>
                <p className="mb-2"><strong>Method:</strong> {useRegularImg ? 'Regular <img>' : 'Next.js <Image>'}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUseRegularImg(false)}
                    className={`px-2 py-1 rounded text-xs ${!useRegularImg ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                  >
                    Next.js Image
                  </button>
                  <button
                    onClick={() => setUseRegularImg(true)}
                    className={`px-2 py-1 rounded text-xs ${useRegularImg ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                  >
                    Regular IMG
                  </button>
                </div>
              </div>
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