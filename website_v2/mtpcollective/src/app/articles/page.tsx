'use client';

import React, { useState, useEffect } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { CalendarIcon, TagIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  published: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  categories?: Category[];
  tags?: Tag[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Tag {
  id: string;
  name: string;
}

// We'll use a client component instead of generating metadata server-side
export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupByCategory, setGroupByCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchArticles = async () => {
    try {
      setIsLoading(true);
      const url = selectedCategory 
        ? `/api/articles?published=true&category=${selectedCategory}`
        : '/api/articles?published=true';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      } else {
        setError('Failed to fetch articles');
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to fetch articles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setGroupByCategory(false); // Reset grouping when filtering
  };

  const selectedCategoryName = categories.find(cat => cat.id === selectedCategory)?.name || '';

  // Group articles by category when groupByCategory is true
  const groupedArticles = groupByCategory ? 
    categories.reduce((acc, category) => {
      const categoryArticles = articles.filter(article => 
        article.categories?.some(cat => cat.id === category.id)
      );
      if (categoryArticles.length > 0) {
        acc[category.name] = categoryArticles;
      }
      return acc;
    }, {} as Record<string, Article[]>) : {};

  const hasGroupedArticles = Object.keys(groupedArticles).length > 0;

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Articles
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Behind-the-scenes stories, photography insights, and creative journeys from MTP Collective
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-white">Filter Articles</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="category" className="text-sm font-medium text-gray-300 whitespace-nowrap">
                  Category:
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 min-w-0"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Group By Category Toggle */}
              {!selectedCategory && (
                <div className="flex items-center gap-2">
                  <label htmlFor="groupBy" className="text-sm font-medium text-gray-300 whitespace-nowrap">
                    Group by category:
                  </label>
                  <input
                    id="groupBy"
                    type="checkbox"
                    checked={groupByCategory}
                    onChange={(e) => setGroupByCategory(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Display */}
          {selectedCategory && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>Showing articles in:</span>
                <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full">
                  {selectedCategoryName}
                </span>
                <button
                  onClick={() => setSelectedCategory('')}
                  className="text-gray-400 hover:text-white ml-2"
                >
                  Clear filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Articles Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-red-400 text-lg mb-4">Error loading articles</div>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : groupByCategory && hasGroupedArticles ? (
          /* Grouped Articles Display */
          <div className="space-y-12">
            {Object.entries(groupedArticles).map(([categoryName, categoryArticles]) => (
              <div key={categoryName} className="space-y-6">
                <div className="flex items-center gap-3">
                  <TagIcon className="w-6 h-6 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">{categoryName}</h2>
                  <span className="text-sm text-gray-400">({categoryArticles.length} articles)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {categoryArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          /* Regular Articles Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          /* No Articles Message */
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-4">
              {selectedCategory ? `No articles found in ${selectedCategoryName}` : 'No articles published yet'}
            </div>
            <p className="text-gray-500">
              {selectedCategory ? 'Try selecting a different category or clearing the filter.' : 'Check back soon for photography stories and insights!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Article Card Component
function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors"
    >
      {article.coverImage && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {article.featured && (
            <div className="absolute top-4 left-4">
              <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Featured
              </span>
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-gray-300 mb-4 line-clamp-2">
            {article.excerpt}
          </p>
        )}
        
        {/* Article Categories */}
        {article.categories && article.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.categories.map((category) => (
              <span
                key={category.id}
                className="text-xs text-blue-300 bg-blue-600/20 px-2 py-1 rounded-full"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-400">
          <CalendarIcon className="w-4 h-4 mr-1" />
          {new Date(article.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
}
