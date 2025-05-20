'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface PhotoUploadProps {
  onUploadComplete: (photo: {
    id: string;
    url: string;
    thumbnail: string;
    title: string;
    description?: string;
  }) => void;
  onError: (error: string) => void;
}

export function PhotoUpload({ onUploadComplete, onError }: PhotoUploadProps) {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleUpload = async () => {
    if (!filePreview || !title) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Convert the preview URL back to a File object
      const response = await fetch(filePreview);
      const blob = await response.blob();
      const file = new File([blob], 'photo.jpg', { type: blob.type });

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      if (description) {
        formData.append('description', description);
      }
      formData.append('categoryIds', '[]'); // Empty array for now
      formData.append('tagIds', '[]'); // Empty array for now

      // Upload to API
      const result = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!result.ok) {
        throw new Error('Failed to upload photo');
      }

      const photo = await result.json();
      onUploadComplete(photo);

      // Reset the form
      setFilePreview(null);
      setTitle('');
      setDescription('');
      setUploadProgress(0);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        {filePreview ? (
          <div className="relative w-full h-64">
            <Image
              src={filePreview}
              alt="Preview"
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragActive ? 'Drop the photo here' : 'Drag and drop a photo here'}
            </p>
            <p className="text-sm text-gray-500">
              or click to select a file
            </p>
            <p className="text-xs text-gray-400">
              Supported formats: JPG, PNG, WebP (max 10MB)
            </p>
          </div>
        )}
      </div>

      {filePreview && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading || !title}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload Photo'}
          </button>

          {isUploading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 