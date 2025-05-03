'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

interface Category {
  id: number;
  name: string;
}

interface Photo {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category: {
    id: number;
    name: string;
  };
  file_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  tags: string[];
}

export default function EditPhoto() {
  const params = useParams();
  const router = useRouter();
  const photoId = params.id;
  
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Fetch photo data based on ID
  useEffect(() => {
    const fetchPhoto = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/photos/${photoId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch photo');
        }
        
        const data = await response.json();
        setPhoto(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setCategoryId(data.category_id);
        setTags(data.tags || []);
      } catch (err: any) {
        setError(err.message || 'Error loading photo');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPhoto();
  }, [photoId]);
  
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
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    
    fetchCategories();
  }, []);
  
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
    
    if (!title) {
      setError('Please enter a title');
      return;
    }
    
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          categoryId: Number(categoryId),
          tags,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update photo');
      }
      
      setSuccess('Photo updated successfully');
      // Update photo data with the latest values
      setPhoto({
        ...photo!,
        title,
        description,
        category_id: Number(categoryId),
        category: {
          id: Number(categoryId),
          name: categories.find(c => c.id === Number(categoryId))?.name || '',
        },
        tags,
      });
      
      // After a short delay, redirect back to the photos list
      setTimeout(() => {
        router.push('/admin/photos');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error updating photo');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete photo');
      }
      
      setSuccess('Photo deleted successfully');
      setTimeout(() => {
        router.push('/admin/photos');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error deleting photo');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    router.push('/admin/photos');
  };
  
  if (loading) {
    return <div>Loading photo details...</div>;
  }
  
  if (!photo && !loading) {
    return (
      <div className="admin-card">
        <h2>Photo Not Found</h2>
        <p>The requested photo was not found or you don't have permission to edit it.</p>
        <button 
          className="btn btn-primary" 
          onClick={() => router.push('/admin/photos')}
        >
          Back to Photos
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Edit Photo</h1>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      
      <div className="admin-card">
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          {/* Photo preview */}
          <div style={{ width: '300px' }}>
            <div style={{ position: 'relative', height: '200px', marginBottom: '1rem' }}>
              <Image
                src={photo?.thumbnail_url || ''}
                alt={photo?.title || ''}
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
            <a 
              href={photo?.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ width: '100%', textAlign: 'center' }}
            >
              View Full Size
            </a>
          </div>
          
          {/* Edit form */}
          <div style={{ flex: 1 }}>
            <form className="admin-form" onSubmit={handleSubmit}>
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
                  rows={4}
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
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={saving}
                  style={{ marginLeft: 'auto' }}
                >
                  Delete Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
