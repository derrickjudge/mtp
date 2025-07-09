'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DocumentTextIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    published: false,
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles');
      if (!response.ok) {
        // If articles API doesn't exist yet, just set empty array
        if (response.status === 404) {
          setArticles([]);
          return;
        }
        throw new Error('Failed to fetch articles');
      }
      const data = await response.json();
      setArticles(data);
    } catch (err) {
      console.error('Articles API not implemented yet:', err);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Article title is required');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Article content is required');
      return;
    }

    setIsCreating(true);

    try {
      const url = editingArticle ? `/api/articles/${editingArticle.id}` : '/api/articles';
      const method = editingArticle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save article');
      }

      const article = await response.json();
      
      if (editingArticle) {
        setArticles(prev => prev.map(art => art.id === article.id ? article : art));
        toast.success('Article updated successfully');
        setEditingArticle(null);
      } else {
        setArticles(prev => [...prev, article]);
        toast.success('Article created successfully');
      }

      setFormData({ title: '', content: '', excerpt: '', published: false });
      setShowForm(false);
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        toast.error('Articles API not implemented yet');
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to save article');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      published: article.published,
    });
    setShowForm(true);
  };

  const handleDelete = async (article: Article) => {
    if (!confirm(`Are you sure you want to delete "${article.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete article');
      }

      setArticles(prev => prev.filter(art => art.id !== article.id));
      toast.success('Article deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete article');
    }
  };

  const handleCancel = () => {
    setEditingArticle(null);
    setFormData({ title: '', content: '', excerpt: '', published: false });
    setShowForm(false);
  };

  const togglePublished = async (article: Article) => {
    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...article, published: !article.published }),
      });

      if (!response.ok) {
        throw new Error('Failed to update article');
      }

      const updatedArticle = await response.json();
      setArticles(prev => prev.map(art => art.id === article.id ? updatedArticle : art));
      toast.success(`Article ${updatedArticle.published ? 'published' : 'unpublished'}`);
    } catch (err) {
      toast.error('Failed to update article status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Article Management</h1>
          <p className="text-gray-400 mt-1">Write and manage your photography articles and stories</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Article
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Article Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">
            {editingArticle ? 'Edit Article' : 'Create New Article'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-200 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter article title"
                required
              />
            </div>

            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-200 mb-2">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={2}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Brief description or excerpt"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-200 mb-2">
                Content *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={12}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Write your article content here..."
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="published" className="ml-2 text-sm text-gray-200">
                Publish immediately
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isCreating ? 'Saving...' : editingArticle ? 'Update Article' : 'Create Article'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Articles List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">Your Articles</h2>
        
        {articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-white">{article.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        article.published 
                          ? 'bg-green-600/20 text-green-300' 
                          : 'bg-yellow-600/20 text-yellow-300'
                      }`}>
                        {article.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {article.excerpt && (
                      <p className="text-sm text-gray-300 mb-2">{article.excerpt}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Created: {new Date(article.createdAt).toLocaleDateString()}
                      {article.updatedAt !== article.createdAt && (
                        <span className="ml-2">
                          • Updated: {new Date(article.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => togglePublished(article)}
                      className={`px-3 py-1 text-sm rounded ${
                        article.published
                          ? 'text-yellow-300 bg-yellow-600/20 hover:bg-yellow-600/30'
                          : 'text-green-300 bg-green-600/20 hover:bg-green-600/30'
                      }`}
                    >
                      {article.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleEdit(article)}
                      className="px-3 py-1 text-sm text-blue-300 bg-blue-600/20 rounded hover:bg-blue-600/30"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(article)}
                      className="px-3 py-1 text-sm text-red-300 bg-red-600/20 rounded hover:bg-red-600/30"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-2">No articles yet</div>
            <p className="text-gray-500 mb-4">Start sharing your photography stories and experiences</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Write Your First Article
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 