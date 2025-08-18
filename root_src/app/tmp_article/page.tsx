import React from 'react';
import { nativeDB } from '@/lib/db-native';

export default async function TmpArticlePage() {
  let articles = [];
  let error = null;
  let dbMethods = [];

  try {
    // Check what methods are available on nativeDB
    dbMethods = Object.keys(nativeDB || {});
    
    // Try to fetch articles
    articles = await nativeDB.findArticles({
      published: true,
      take: 50,
    });
  } catch (err) {
    error = err;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Temporary Articles Debug Page</h1>
        
        {/* Database Methods */}
        <div className="mb-8 p-4 bg-gray-900 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Available nativeDB Methods:</h2>
          <pre className="text-sm text-green-400 overflow-x-auto">
            {JSON.stringify(dbMethods, null, 2)}
          </pre>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-900 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-red-400">Error:</h2>
            <pre className="text-sm text-red-300 overflow-x-auto">
              {error.toString()}
            </pre>
            <pre className="text-sm text-red-300 overflow-x-auto mt-2">
              {error.stack}
            </pre>
          </div>
        )}

        {/* Articles Count */}
        <div className="mb-8 p-4 bg-gray-900 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Articles Found:</h2>
          <p className="text-2xl text-blue-400">{articles.length} articles</p>
        </div>

        {/* Raw Articles Data */}
        <div className="mb-8 p-4 bg-gray-900 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Raw Articles Data:</h2>
          <pre className="text-sm text-gray-300 overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(articles, null, 2)}
          </pre>
        </div>

        {/* Articles List */}
        {articles.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Articles List:</h2>
            <div className="grid gap-4">
              {articles.map((article, index) => (
                <div key={article.id || index} className="p-4 bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-bold text-blue-400 mb-2">
                    {article.title || 'No Title'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>ID:</strong> {article.id || 'N/A'}
                    </div>
                    <div>
                      <strong>Slug:</strong> {article.slug || 'N/A'}
                    </div>
                    <div>
                      <strong>Published:</strong> {article.published ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <strong>Featured:</strong> {article.featured ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <strong>Created:</strong> {article.createdAt || 'N/A'}
                    </div>
                    <div>
                      <strong>Updated:</strong> {article.updatedAt || 'N/A'}
                    </div>
                  </div>
                  {article.excerpt && (
                    <div className="mt-2">
                      <strong>Excerpt:</strong> {article.excerpt}
                    </div>
                  )}
                  {article.coverImage && (
                    <div className="mt-2">
                      <strong>Cover Image:</strong> {article.coverImage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Different Query */}
        <div className="mb-8 p-4 bg-gray-900 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Test Query Without Filters:</h2>
          <TestAllArticles />
        </div>
      </div>
    </div>
  );
}

// Component to test fetching all articles without filters
async function TestAllArticles() {
  let allArticles = [];
  let error = null;

  try {
    // Try to fetch all articles without any filters
    allArticles = await nativeDB.findArticles({});
  } catch (err) {
    error = err;
  }

  if (error) {
    return (
      <div className="text-red-400">
        <p>Error fetching all articles: {error.toString()}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-blue-400 mb-2">All Articles (no filters): {allArticles.length}</p>
      <pre className="text-sm text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
        {JSON.stringify(allArticles.map(a => ({ 
          id: a.id, 
          title: a.title, 
          slug: a.slug, 
          published: a.published,
          featured: a.featured 
        })), null, 2)}
      </pre>
    </div>
  );
} 