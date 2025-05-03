'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Photo {
  id: number;
  title: string;
  description: string;
  category: {
    id: number;
    name: string;
  };
  thumbnail_url: string;
  file_url: string;
  tags: string[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminPhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Fetch photos when page, limit, or category changes
  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      try {
        let url = `/api/photos?page=${pagination.page}&limit=${pagination.limit}`;
        if (selectedCategory) {
          url += `&category=${selectedCategory}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch photos');
        }

        const data = await response.json();
        setPhotos(data.photos);
        setPagination(data.pagination);
      } catch (err: any) {
        setError(err.message || 'Error loading photos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [pagination.page, pagination.limit, selectedCategory]);

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };

    fetchCategories();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      // Remove the deleted photo from the state
      setPhotos(photos.filter(photo => photo.id !== id));
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1,
      }));

    } catch (err: any) {
      setError(err.message || 'Error deleting photo');
      console.error(err);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        page: newPage,
      }));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Manage Photos</h1>
        <Link href="/admin/photos/upload">
          <button className="btn btn-primary">Upload New Photo</button>
        </Link>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <h2>Filters</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="category-filter">Category</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading photos...</p>
      ) : photos.length === 0 ? (
        <div className="admin-card">
          <p>No photos found. Upload some photos to get started.</p>
        </div>
      ) : (
        <>
          <div className="photo-grid">
            {photos.map(photo => (
              <div key={photo.id} className="photo-item">
                <div style={{ position: 'relative', height: '180px' }}>
                  <Image
                    src={photo.thumbnail_url}
                    alt={photo.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="photo-item-actions">
                    <Link href={`/admin/photos/edit/${photo.id}`}>
                      <button title="Edit">
                        <span>✏️</span>
                      </button>
                    </Link>
                    <button
                      title="Delete"
                      onClick={() => handleDelete(photo.id)}
                    >
                      <span>🗑️</span>
                    </button>
                  </div>
                </div>
                <div className="photo-item-details">
                  <h3 className="photo-item-title">{photo.title}</h3>
                  <p className="photo-item-category">{photo.category.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginTop: '2rem',
              gap: '0.5rem'
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                margin: '0 1rem' 
              }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
