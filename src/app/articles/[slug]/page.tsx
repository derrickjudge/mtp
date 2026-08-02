import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { nativeDB } from '@/lib/db-native';
import { CalendarIcon, TagIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ArticlePhotoGallery, type ArticleGalleryPhoto } from '@/components/photos/ArticlePhotoGallery';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  published: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  photos?: ArticleGalleryPhoto[];
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const article = await nativeDB.findArticleBySlug(slug);
    if (!article || !article.published) {
      return null;
    }
    
    // Get the article with relations
    const articleWithRelations = await nativeDB.getArticleWithRelations(article.id);
    return articleWithRelations;
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
    description: article.excerpt || `Read ${article.title} - a photography article by MTP Collective`,
    keywords: ['photography', 'MTP Collective', article.title, ...(article.categories?.map(cat => cat.name) || [])],
    openGraph: {
      title: article.title,
      description: article.excerpt || `Read ${article.title} - a photography article by MTP Collective`,
      type: 'article',
      url: `/articles/${article.slug}`,
      images: article.coverImage ? [{ url: article.coverImage, alt: article.title }] : [],
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
      authors: ['MTP Collective'],
      tags: article.categories?.map(cat => cat.name) || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || `Read ${article.title} - a photography article by MTP Collective`,
      images: article.coverImage ? [article.coverImage] : [],
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
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <header className="mb-12">
          {/* Categories */}
          {article.categories && article.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/articles?category=${category.slug}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-colors"
                >
                  <TagIcon className="w-4 h-4 mr-1" />
                  {category.name}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-6">
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                {new Date(article.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              {article.featured && (
                <span className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
                  Featured
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {article.coverImage && (
          <div className="relative h-96 md:h-[500px] mb-12 rounded-lg overflow-hidden">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Article Content */}
        <div
          className="prose prose-invert prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Photo Set */}
        {article.photos && article.photos.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Photos</h2>
            <ArticlePhotoGallery photos={article.photos} />
          </section>
        )}

        {/* Article Footer */}
        <footer className="border-t border-gray-800 pt-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Last updated: {new Date(article.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
