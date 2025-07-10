import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { nativeDB } from '@/lib/db-native';

export const metadata: Metadata = {
  title: 'Articles | MTP Collective',
  description: 'Photography stories, behind-the-scenes content, and insights from MTP Collective.',
};

export default async function ArticlesPage() {
  const articles = await nativeDB.findArticles({
    published: true,
    take: 50,
  });

  return (
    <div className="min-h-screen bg-black">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {articles.length === 0 && (
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
