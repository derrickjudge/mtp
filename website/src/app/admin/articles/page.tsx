'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface PaginatedResponse {
  items: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminArticles() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [publishedFilter, setPublishedFilter] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch articles with current filters and pagination
  const fetchArticles = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (categoryFilter !== null) {
        params.append('category', categoryFilter.toString());
      }
      
      if (publishedFilter !== null) {
        params.append('published', publishedFilter.toString());
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/articles?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.status}`);
      }
      
      const data: PaginatedResponse = await response.json();
      setArticles(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
      
    } catch (err: any) {
      console.error('Error fetching articles:', err);
      setError(err.message || 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };
  
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
  
  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, []);
  
  // Refetch when filters or pagination changes
  useEffect(() => {
    fetchArticles();
  }, [page, limit, categoryFilter, publishedFilter]);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchArticles();
  };
  
  // Handle publish/unpublish toggle
  const handlePublishToggle = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: !currentStatus
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update article status');
      }
      
      // Update the article in the state
      setArticles(prevArticles => 
        prevArticles.map(article => 
          article.id === id 
            ? { ...article, published: !currentStatus } 
            : article
        )
      );
      
      setSuccess(`Article ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: any) {
      setError(err.message || 'Error updating article status');
    }
  };
  
  // Handle article deletion
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete article');
      }
      
      // Remove the article from the state
      setArticles(prevArticles => 
        prevArticles.filter(article => article.id !== id)
      );
      
      setSuccess('Article deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: any) {
      setError(err.message || 'Error deleting article');
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setCategoryFilter(null);
    setPublishedFilter(null);
    setSearchQuery('');
    setPage(1);
  };
  
  return (
    <div className="admin-articles">
      <div className="admin-header">
        <h1>Manage Articles</h1>
        <Link href="/admin/articles/new" className="btn btn-primary">
          Create New Article
        </Link>
      </div>
      
      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <h2>Filters</h2>
        <div className="filter-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div className="filter-item">
            <label htmlFor="category-filter">Category:</label>
            <select 
              id="category-filter"
              value={categoryFilter === null ? '' : categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="published-filter">Status:</label>
            <select 
              id="published-filter"
              value={publishedFilter === null ? '' : publishedFilter ? 'true' : 'false'}
              onChange={(e) => {
                if (e.target.value === '') {
                  setPublishedFilter(null);
                } else {
                  setPublishedFilter(e.target.value === 'true');
                }
              }}
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          </div>
          
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: '1' }}>
            <input
              type="search"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: '1' }}
            />
            <button type="submit" className="btn btn-secondary">Search</button>
            <button type="button" className="btn btn-secondary" onClick={resetFilters}>Reset</button>
          </form>
        </div>
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
      
      {/* Articles Table */}
      <div className="admin-card">
        {loading ? (
          <p>Loading articles...</p>
        ) : articles.length === 0 ? (
          <p>No articles found. {categoryFilter || publishedFilter !== null || searchQuery ? 'Try adjusting your filters.' : 'Create your first article!'}</p>
        ) : (
          <>
            <p className="filter-info">
              Showing {articles.length} of {totalItems} articles
            </p>
            
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(article => (
                  <tr key={article.id}>
                    <td>
                      <div className="article-title">
                        <img 
                          src={article.featured_image || '/images/placeholder.jpg'} 
                          alt={article.title}
                          width={50}
                          height={50}
                          style={{ objectFit: 'cover', marginRight: '0.5rem' }}
                        />
                        <div>
                          <div>{article.title}</div>
                          <div className="article-slug">{article.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>{article.category.name}</td>
                    <td>{article.author_name}</td>
                    <td>
                      <span className={`status-badge ${article.published ? 'published' : 'draft'}`}>
                        {article.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      {article.published_at 
                        ? new Date(article.published_at).toLocaleDateString() 
                        : '-'}
                    </td>
                    <td className="actions">
                      <div className="action-buttons">
                        <Link href={`/admin/articles/${article.id}`} className="btn btn-small">
                          Edit
                        </Link>
                        <Link href={`/articles/${article.slug}`} target="_blank" className="btn btn-small btn-secondary">
                          View
                        </Link>
                        <button 
                          className={`btn btn-small ${article.published ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => handlePublishToggle(article.id, article.published)}
                        >
                          {article.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button 
                          className="btn btn-small btn-danger"
                          onClick={() => handleDelete(article.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
