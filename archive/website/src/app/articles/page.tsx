'use client';

import React, { useEffect, useState } from 'react';
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
  featured_image: string;
  author_name: string;
  published_at: string;
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

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(12);
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  
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
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (activeTag) {
        params.append('tag', activeTag);
      }
      
      const response = await fetch(`/api/articles?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.status}`);
      }
      
      const data: PaginatedResponse = await response.json();
      setArticles(data.items);
      setTotalPages(data.totalPages);
      
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
  }, [page, categoryFilter, activeTag]);
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchArticles();
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Handle tag click
  const handleTagClick = (tag: string) => {
    setActiveTag(activeTag === tag ? null : tag);
    setPage(1); // Reset to first page when changing tag filter
  };
  
  // Clear all filters
  const clearFilters = () => {
    setCategoryFilter(null);
    setActiveTag(null);
    setSearchQuery('');
    setPage(1);
  };
  
  // Get unique tags across all articles
  const getAllTags = () => {
    const tags = new Set<string>();
    articles.forEach(article => {
      article.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };
  
  return (
    <div style={{
      maxWidth: '100%',
      padding: '2rem 0',
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#000',
      color: '#e0e0e0',
      minHeight: '100vh'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '1200px',
        margin: '0 auto 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          color: '#ffffff'
        }}>MTP Collective Articles</h1>
        <p style={{ color: '#aaa', marginBottom: '2rem' }}>
          Insights, stories, and perspectives on photography and visual arts
        </p>
      </div>
      
      {/* Filters */}
      <div style={{
        width: '90%',
        maxWidth: '1200px',
        margin: '0 auto 2rem'
      }}>
        <div style={{
          backgroundColor: '#111',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <button 
                onClick={() => setCategoryFilter(null)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: categoryFilter === null ? '#ffffff' : '#2a2a2a',
                  color: categoryFilter === null ? '#000000' : '#e0e0e0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: categoryFilter === null ? 'bold' : 'normal'
                }}
              >
                All
              </button>

              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setCategoryFilter(category.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: categoryFilter === category.id ? '#ffffff' : '#2a2a2a',
                    color: categoryFilter === category.id ? '#000000' : '#e0e0e0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: categoryFilter === category.id ? 'bold' : 'normal'
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <form onSubmit={handleSearch} style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    backgroundColor: '#111',
                    color: '#e0e0e0',
                    width: '300px',
                    maxWidth: '100%'
                  }}
                />
                <button 
                  type="submit" 
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2a2a2a',
                    color: '#e0e0e0',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >Search</button>
              </form>
              
              {(categoryFilter !== null || activeTag || searchQuery) && (
                <button 
                  onClick={clearFilters} 
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.4rem 0.8rem',
                    backgroundColor: 'transparent',
                    color: '#aaa',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
            
            {/* Tags */}
            {getAllTags().length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  {getAllTags().map(tag => (
                    <span 
                      key={tag} 
                      style={{
                        display: 'inline-block',
                        padding: '0.3rem 0.8rem',
                        backgroundColor: activeTag === tag ? '#ffffff' : '#2a2a2a',
                        color: activeTag === tag ? '#000000' : '#e0e0e0',
                        borderRadius: '30px',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        fontWeight: activeTag === tag ? 'bold' : 'normal'
                      }}
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: 'rgba(255, 0, 0, 0.1)', 
          border: '1px solid rgba(255, 0, 0, 0.3)',
          borderRadius: '4px',
          color: '#ff6b6b',
          textAlign: 'center',
          marginBottom: '2rem',
          maxWidth: '800px'
        }}>
          {error}
        </div>
      )}
      
      {/* Articles */}
      {loading ? (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: '#aaa' 
        }}>
          <div style={{ 
            border: '4px solid rgba(255,255,255,0.1)', 
            borderTopColor: '#fff',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          Loading articles...
        </div>
      ) : articles.length === 0 ? (
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center',
          color: '#aaa'
        }}>
          <p>No articles found. {categoryFilter || activeTag || searchQuery ? 'Try adjusting your filters.' : ''}</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '2rem',
          width: '90%',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {articles.map(article => (
            <article key={article.id} style={{
              backgroundColor: '#111',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ position: 'relative' }}>
                <Link href={`/articles/${article.slug}`} style={{ display: 'block', height: '200px' }}>
                  <img 
                    src={article.featured_image || '/images/placeholder.jpg'} 
                    alt={article.title}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Link>
                
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}>
                  <Link 
                    href={`/articles?category=${article.category.id}`}
                    style={{ color: '#fff', textDecoration: 'none' }}
                    onClick={(e) => {
                      e.preventDefault();
                      setCategoryFilter(article.category.id);
                    }}
                  >
                    {article.category.name}
                  </Link>
                </div>
              </div>
              
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: '1' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', lineHeight: '1.3' }}>
                  <Link href={`/articles/${article.slug}`} style={{ color: '#fff', textDecoration: 'none' }}>
                    {article.title}
                  </Link>
                </h2>
                
                <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                  <span>{article.author_name}</span>
                  <span>{formatDate(article.published_at)}</span>
                </div>
                
                <p style={{ 
                  fontSize: '0.95rem', 
                  color: '#ccc', 
                  marginBottom: '1.25rem',
                  lineHeight: '1.6',
                  flex: '1',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>{article.summary}</p>
                
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.4rem',
                  marginBottom: '1.25rem' 
                }}>
                  {article.tags.map(tag => (
                    <span 
                      key={tag} 
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.6rem',
                        backgroundColor: activeTag === tag ? '#ffffff' : '#2a2a2a',
                        color: activeTag === tag ? '#000000' : '#e0e0e0',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); 
                        handleTagClick(tag);
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <Link 
                  href={`/articles/${article.slug}`} 
                  style={{
                    color: '#4d9fff',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    alignSelf: 'flex-start'
                  }}
                >
                  Read More
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '1rem',
          margin: '3rem 0 2rem'
        }}>
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: page === 1 ? '#1a1a1a' : '#2a2a2a',
              color: page === 1 ? '#666' : '#e0e0e0',
              border: '1px solid #444',
              borderRadius: '4px',
              cursor: page === 1 ? 'default' : 'pointer',
              opacity: page === 1 ? 0.7 : 1
            }}
          >
            Previous
          </button>
          
          <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
            Page {page} of {totalPages}
          </div>
          
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: page === totalPages ? '#1a1a1a' : '#2a2a2a',
              color: page === totalPages ? '#666' : '#e0e0e0',
              border: '1px solid #444',
              borderRadius: '4px',
              cursor: page === totalPages ? 'default' : 'pointer',
              opacity: page === totalPages ? 0.7 : 1
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
