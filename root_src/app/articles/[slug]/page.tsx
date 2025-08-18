import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { nativeDB } from '@/lib/db-native';
import { ArrowLeftIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface Article {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  published: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const article = await nativeDB.findArticleBySlug(slug);
    if (!article || !article.published) {
      return null;
    }
    return article;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug);
  
  if (!article) {
    return {
      title: 'Article Not Found | MTP Collective',
      description: 'The requested article could not be found.',
    };
  }

  return {
    title: `${article.title} | MTP Collective`,
    description: article.excerpt || 'Photography story from MTP Collective',
    keywords: ['photography', 'article', 'MTP Collective', article.title],
    openGraph: {
      title: article.title,
      description: article.excerpt || 'Photography story from MTP Collective',
      type: 'article',
      url: `/articles/${article.slug}`,
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  
  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/articles"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Articles
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cover Image */}
        {article.coverImage && (
          <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
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

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {article.title}
          </h1>
          
          {article.excerpt && (
            <p className="text-xl text-gray-300 mb-6">
              {article.excerpt}
            </p>
          )}
          
          <div className="flex items-center text-gray-400">
            <CalendarIcon className="w-5 h-5 mr-2" />
            <time dateTime={article.createdAt}>
              {new Date(article.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg prose-invert max-w-none">
          {article.content ? (
            <div
              className="text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <p className="text-gray-300">
              Article content is not available.
            </p>
          )}
        </div>
      </article>
    </div>
  );
} 