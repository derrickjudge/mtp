'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
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

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  
  // Fetch article by slug
  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch(`/api/articles/slug/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/articles');
            return;
          }
          throw new Error(`Failed to fetch article: ${response.status}`);
        }
        
        const data = await response.json();
        setArticle(data);
        
        // Fetch related articles
        fetchRelatedArticles(data);
      } catch (err: any) {
        console.error('Error fetching article:', err);
        setError(err.message || 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticle();
  }, [slug, router]);
  
  // Fetch related articles (same category or sharing tags)
  const fetchRelatedArticles = async (currentArticle: Article) => {
    try {
      // Build query for related articles
      const params = new URLSearchParams();
      params.append('limit', '3');
      params.append('category', currentArticle.category.id.toString());
      
      const response = await fetch(`/api/articles?${params.toString()}`);
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      
      // Filter out the current article and limit to 3
      const related = data.items
        .filter((article: Article) => article.id !== currentArticle.id)
        .slice(0, 3);
      
      setRelatedArticles(related);
    } catch (err) {
      console.warn('Error fetching related articles:', err);
    }
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
  
  if (loading) {
    return <div className="loading">Loading article...</div>;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Article</h2>
        <p>{error}</p>
        <Link href="/articles" className="back-link">
          Return to Articles
        </Link>
      </div>
    );
  }
  
  if (!article) {
    return (
      <div className="not-found">
        <h2>Article Not Found</h2>
        <p>The article you're looking for doesn't exist or has been removed.</p>
        <Link href="/articles" className="back-link">
          Return to Articles
        </Link>
      </div>
    );
  }
  
  return (
    <div style={{
      maxWidth: '100%',
      padding: '2rem 0',
      margin: 0,
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#000',
      color: '#e0e0e0'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2.5rem',
        backgroundColor: '#111',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        borderRadius: '8px'
      }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#aaa' }}>
          <Link href="/" style={{ color: '#aaa', textDecoration: 'none' }}>Home</Link> / 
          <Link href="/articles" style={{ color: '#aaa', textDecoration: 'none' }}>Articles</Link> / 
          <Link href={`/articles?category=${article.category.id}`} style={{ color: '#aaa', textDecoration: 'none' }}>{article.category.name}</Link> / 
          <span>{article.title}</span>
        </div>
        
        {/* Article Header */}
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold',
            marginBottom: '1.25rem',
            lineHeight: 1.2,
            color: '#ffffff'
          }}>{article.title}</h1>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            fontSize: '0.95rem',
            color: '#aaa'
          }}>
            <span>By {article.author_name}</span>
            <span>{formatDate(article.published_at)}</span>
            <span>
              <Link href={`/articles?category=${article.category.id}`} style={{ color: '#4d9fff', textDecoration: 'none' }}>
                {article.category.name}
              </Link>
            </span>
          </div>
        </header>
        
        {/* Featured Image */}
        {article.featured_image && (
          <div style={{
            margin: '1.5rem 0 2.5rem',
            textAlign: 'center',
            maxHeight: '400px',
            overflow: 'hidden',
            borderRadius: '8px',
            width: '100%'
          }}>
            <img 
              src={article.featured_image} 
              alt={article.title}
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                borderRadius: '8px'
              }} 
            />
          </div>
        )}
        
        {/* Article Content */}
        <div className="article-content-wrapper" style={{ 
            fontSize: '1.1rem',
            lineHeight: 1.8,
            marginBottom: '2.5rem',
            color: '#e0e0e0'
          }}>
          <style jsx global>{`
            .article-content-wrapper h2 {
              font-size: 1.8rem;
              margin: 2rem 0 1rem;
              color: #ffffff;
            }
            .article-content-wrapper h3 {
              font-size: 1.5rem;
              margin: 1.8rem 0 1rem;
              color: #ffffff;
            }
            .article-content-wrapper p {
              margin-bottom: 1.5rem;
              color: #e0e0e0;
            }
            .article-content-wrapper img {
              max-width: 100%;
              height: auto;
              max-height: 500px;
              margin: 1.5rem 0;
              object-fit: contain;
              display: block;
              margin-left: auto;
              margin-right: auto;
            }
            .article-content-wrapper a {
              color: #4d9fff;
              text-decoration: none;
            }
            .article-content-wrapper a:hover {
              text-decoration: underline;
            }
            .article-content-wrapper ul, .article-content-wrapper ol {
              margin: 1rem 0 1.5rem 1.5rem;
              color: #e0e0e0;
            }
          `}</style>
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
        
        {/* Tags */}
        {article.tags.length > 0 && (
          <div style={{ margin: '2rem 0' }}>
            <h3 style={{ 
              fontSize: '1.2rem',
              marginBottom: '0.8rem',
              color: '#ffffff'
            }}>Tags:</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {article.tags.map(tag => (
                <Link 
                  key={tag} 
                  href={`/articles?tag=${encodeURIComponent(tag)}`}
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#2a2a2a',
                    color: '#e0e0e0',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '30px',
                    fontSize: '0.85rem',
                    textDecoration: 'none'
                  }}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Share buttons (you can implement the actual functionality) */}
        <div style={{ margin: '2rem 0', borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#fff' }}>Share this article:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
            <button style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              color: '#e0e0e0',
              padding: '0.5rem 1rem',
              borderRadius: '30px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}>
              <i className="icon-facebook"></i> Facebook
            </button>
            <button style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              color: '#e0e0e0',
              padding: '0.5rem 1rem',
              borderRadius: '30px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}>
              <i className="icon-twitter"></i> Twitter
            </button>
            <button style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              color: '#e0e0e0',
              padding: '0.5rem 1rem',
              borderRadius: '30px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}>
              <i className="icon-linkedin"></i> LinkedIn
            </button>
            <button style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              color: '#e0e0e0',
              padding: '0.5rem 1rem',
              borderRadius: '30px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}>
              <i className="icon-link"></i> Copy Link
            </button>
          </div>
        </div>
        
        {/* Author Bio (can be expanded) */}
        <div style={{ 
          margin: '2.5rem 0',
          padding: '1.5rem',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px'
        }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center', color: '#fff' }}>About the Author</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ flexShrink: 0 }}>
              {/* Placeholder image */}
              <img 
                src="/images/placeholder-author.jpg" 
                alt={article.author_name} 
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#fff' }}>{article.author_name}</h4>
              <p style={{ fontSize: '0.95rem', color: '#aaa', margin: 0 }}>Photographer and writer at MTP Collective.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div style={{ 
          width: '90%',
          maxWidth: '1000px',
          margin: '3rem auto',
          padding: '0 2rem'
        }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', textAlign: 'center', color: '#fff' }}>Related Articles</h2>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            {relatedArticles.map(relatedArticle => (
              <article key={relatedArticle.id} style={{
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#111',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}>
                <Link href={`/articles/${relatedArticle.slug}`} style={{
                  display: 'block',
                  height: '150px',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={relatedArticle.featured_image || '/images/placeholder.jpg'} 
                    alt={relatedArticle.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                </Link>
                <div style={{ padding: '1.2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    <Link href={`/articles/${relatedArticle.slug}`} style={{ color: '#fff', textDecoration: 'none' }}>
                      {relatedArticle.title}
                    </Link>
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#777', marginBottom: '0.8rem' }}>
                    <span>{formatDate(relatedArticle.published_at)}</span>
                  </div>
                  <p style={{ 
                    fontSize: '0.9rem',
                    color: '#aaa',
                    marginBottom: '1rem',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>{relatedArticle.summary}</p>
                  <Link href={`/articles/${relatedArticle.slug}`} style={{
                    display: 'inline-block',
                    color: '#4d9fff',
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    fontWeight: 500
                  }}>
                    Read More
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
      
      {/* Back to Articles Link */}
      <div style={{ textAlign: 'center', margin: '2rem auto 4rem' }}>
        <Link href="/articles" style={{
          display: 'inline-block',
          padding: '0.8rem 1.5rem',
          backgroundColor: '#2a2a2a',
          color: '#e0e0e0',
          borderRadius: '4px',
          textDecoration: 'none',
          fontWeight: 500
        }}>
          Back to All Articles
        </Link>
      </div>
    </div>
  );
}
