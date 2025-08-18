import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { nativeDB } from '@/lib/db-native';
import { CalendarIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Articles | MTP Collective',
  description: 'Photography stories, behind-the-scenes content, and insights from MTP Collective.',
  keywords: ['photography articles', 'behind the scenes', 'concert photography', 'automotive photography', 'nature photography', 'MTP Collective'],
};

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
}

async function getArticles(): Promise<Article[]> {
  try {
    const articles = await nativeDB.findArticles({
      published: true,
      take: 20,
    });
    return articles || [];
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

export default async function ArticlesPage() {
  const articles = await getArticles();

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

      {/* Debug Section - TEMPORARY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">🔧 DEBUG INFO (Temporary)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-bold text-white mb-2">Articles Found:</h3>
              <p className="text-blue-400 text-xl">{articles.length} articles</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Database Methods:</h3>
              <p className="text-green-400">{Object.keys(nativeDB || {}).length} methods available</p>
            </div>
          </div>
          
          {articles.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold text-white mb-2">Raw Article Data:</h3>
              <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                {JSON.stringify(articles, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-4">
              No articles published yet
            </div>
            <p className="text-gray-500">
              Check back soon for photography stories and insights!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple Article Card Component
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
        <div className="flex items-center text-sm text-gray-400">
          <CalendarIcon className="w-4 h-4 mr-1" />
          {new Date(article.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
} 