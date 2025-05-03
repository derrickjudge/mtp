'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface Category {
  id: number;
  name: string;
}

export default function UploadPhoto() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  // Fetch categories for the dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data);

        // Set default category if available
        if (data.length > 0) {
          setCategoryId(data[0].id);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Failed to load categories. Please refresh and try again.');
      }
    };

    fetchCategories();
  }, []);

  // File upload handling with dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Extract title from filename if empty
      if (!title) {
        const fileName = file.name.split('.')[0];
        setTitle(fileName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    maxFiles: 1,
    maxSize: 10485760 // 10 MB
  });

  // Tag handling
  const addTag = () => {
    if (tagInput && !tags.includes(tagInput.toLowerCase())) {
      setTags([...tags, tagInput.toLowerCase()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please upload an image');
      return;
    }

    if (!title) {
      setError('Please enter a title');
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    setUploadProgress(0);

    try {
      // First, create a presigned URL for S3 upload
      const uploadUrlResponse = await fetch('/api/photos/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileUrl, thumbnailUrl } = await uploadUrlResponse.json();

      // Upload file to S3 with progress tracking
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });

      // Now create the photo in the database
      const photoResponse = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          categoryId: Number(categoryId),
          tags,
          fileUrl,
          thumbnailUrl,
          width: 1200, // We'll use fixed values for now
          height: 800,
          uploadDate: new Date().toISOString(),
        }),
      });

      if (!photoResponse.ok) {
        throw new Error('Failed to save photo information');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/photos');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error uploading photo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Upload New Photo</h1>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          Photo uploaded successfully! Redirecting...
        </div>
      )}

      <div className="admin-card">
        <form className="admin-form" onSubmit={handleSubmit}>
          {/* File Upload Dropzone */}
          <div className="form-group">
            <label>Photo</label>
            <div 
              {...getRootProps()} 
              className={`dropzone ${isDragActive ? 'active' : ''}`}
              style={{
                borderColor: isDragActive ? '#2563eb' : '#e5e7eb',
                backgroundColor: isDragActive ? '#f0f7ff' : 'transparent'
              }}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div style={{ position: 'relative', height: '200px' }}>
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div>
                  <p>Drag & drop a photo here, or click to select one</p>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    JPG, PNG, or WebP up to 10MB
                  </p>
                </div>
              )}
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ 
                  height: '10px', 
                  width: '100%', 
                  backgroundColor: '#e5e7eb',
                  borderRadius: '5px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${uploadProgress}%`, 
                    backgroundColor: '#2563eb',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>
                  {uploadProgress}% uploaded
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Enter a tag and press Enter"
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addTag}
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                {tags.map(tag => (
                  <span key={tag} className="tag-badge">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        marginLeft: '4px'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload Photo'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/admin/photos')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
