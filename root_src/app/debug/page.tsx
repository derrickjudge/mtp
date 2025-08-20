import React from 'react';
import { nativeDB } from '@/lib/db-native';

export default async function DebugPage() {
  let articles = [];
  let error = null;

  try {
    articles = await nativeDB.findArticles({
      published: true,
      take: 50,
    });
  } catch (err) {
    error = err;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug: Articles Data</h1>
        
        {error && (
          <div className="mb-8 p-4 bg-red-900 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-red-400">Error:</h2>
            <pre className="text-sm text-red-300">
              {error.toString()}
            </pre>
          </div>
        )}

        <div className="mb-8 p-4 bg-gray-900 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Articles Found:</h2>
          <p className="text-2xl text-blue-400">{articles.length} articles</p>
        </div>

        <div className="mb-8 p-4 bg-gray-900 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Raw Data:</h2>
          <pre className="text-sm text-gray-300 overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(articles, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 