'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image: string;
  author_id: number;
  author_name: string;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  category: {
    id: number;
    name: string;
  };
}

export default function ArticleEditor() {
  const router = useRouter();
  const params = useParams();
  const articleId = params?.id as string;
  const isNewArticle = articleId === 'new';
  
  // Form state
  const [article, setArticle] = useState<Partial<Article>>({
    title: '',
    content: '',
    summary: '',
    featured_image: '',
    published: false,
    tags: [],
    category: {
      id: 1,
      name: 'Nature'
    }
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  
  // Fetch article data if editing an existing article
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch categories first
        await fetchCategories();
        
        // If we're creating a new article, we're done
        if (isNewArticle) {
          setLoading(false);
          return;
        }
        
        // Fetch existing article data
        const response = await fetch(`/api/articles/${articleId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Article not found');
          }
          throw new Error(`Failed to fetch article: ${response.status}`);
        }
        
        const data = await response.json();
        setArticle(data);
        
        // Set tags input field
        if (data.tags && Array.isArray(data.tags)) {
          setTagsInput(data.tags.join(', '));
        }
      } catch (err: any) {
        console.error('Error loading article:', err);
        setError(err.message || 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [articleId, isNewArticle]);
  
  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/articles/categories');
      
      if (!response.ok) {
        console.warn('Could not fetch categories');
        return;
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setCategories(data.data);
      }
    } catch (err) {
      console.warn('Error fetching categories:', err);
    }
  };
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'category_id') {
      const categoryId = parseInt(value);
      const category = categories.find(c => c.id === categoryId);
      
      setArticle(prev => ({
        ...prev,
        category: category ? { id: category.id, name: category.name } : prev.category
      }));
    } else {
      setArticle(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setArticle(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Process tags from comma-separated string into array
      const tags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Prepare article data for submission
      const articleData = {
        ...article,
        tags
      };
      
      // Create new or update existing article
      const url = isNewArticle ? '/api/articles' : `/api/articles/${articleId}`;
      const method = isNewArticle ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isNewArticle ? 'create' : 'update'} article`);
      }
      
      const data = await response.json();
      
      setSuccess(`Article ${isNewArticle ? 'created' : 'updated'} successfully!`);
      
      // Redirect to edit page if we just created a new article
      if (isNewArticle && data.article && data.article.id) {
        router.push(`/admin/articles/${data.article.id}`);
      }
    } catch (err: any) {
      console.error('Error saving article:', err);
      setError(err.message || `Failed to ${isNewArticle ? 'create' : 'update'} article`);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <div className="admin-loading">Loading article...</div>;
  }
  
  return (
    <div className="article-editor">
      <div className="admin-header">
        <h1>{isNewArticle ? 'Create New Article' : 'Edit Article'}</h1>
        <Link href="/admin/articles" className="btn btn-secondary">
          Back to Articles
        </Link>
      </div>
      
      {/* Alerts */}
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
      
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-card">
          <h2>Article Details</h2>
          
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              value={article.title || ''}
              onChange={handleChange}
              required
              placeholder="Enter article title"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="summary">Summary</label>
            <textarea
              id="summary"
              name="summary"
              value={article.summary || ''}
              onChange={handleChange}
              rows={3}
              placeholder="Brief summary of the article (will be used in previews)"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="featured_image">Featured Image URL</label>
            <input
              id="featured_image"
              name="featured_image"
              type="url"
              value={article.featured_image || ''}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
            {article.featured_image && (
              <div className="image-preview">
                <img 
                  src={article.featured_image} 
                  alt="Featured" 
                  style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '0.5rem' }}
                />
              </div>
            )}
          </div>
          
          <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="category_id">Category</label>
              <select
                id="category_id"
                name="category_id"
                value={article.category?.id || ''}
                onChange={handleChange}
                required
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="tags">Tags</label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
              <small>Separate tags with commas</small>
            </div>
          </div>
          
          <div className="form-group">
            <div className="checkbox-group">
              <input
                id="published"
                name="published"
                type="checkbox"
                checked={article.published || false}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="published">Publish immediately</label>
            </div>
          </div>
        </div>
        
        <div className="admin-card">
          <h2>Article Content</h2>
          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={article.content || ''}
              onChange={handleChange}
              rows={20}
              required
              placeholder="Article content in HTML format"
            />
            <small>You can use HTML formatting for rich text</small>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : isNewArticle ? 'Create Article' : 'Update Article'}
          </button>
          
          <Link href="/admin/articles" className="btn btn-secondary">
            Cancel
          </Link>
          
          {!isNewArticle && (
            <Link href={`/articles/${article.slug}`} target="_blank" className="btn btn-secondary">
              View Article
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
