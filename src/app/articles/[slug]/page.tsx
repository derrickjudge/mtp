import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { nativeDB } from '@/lib/db-native';
import { CalendarIcon, TagIcon, ArrowLeftIcon, ShareIcon } from '@heroicons/react/24/outline';

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

async function getRelatedArticles(currentArticleId: string, categories: string[]): Promise<Article[]> {
  try {
    if (categories.length === 0) {
      return [];
    }
    
    const articles = await nativeDB.findArticles({
      published: true,
      take: 3,
    });
    
    // Filter out current article and find articles with matching categories
    const relatedArticles = articles
      .filter(article => article.id !== currentArticleId)
      .filter(article => 
        article.categories?.some(cat => categories.includes(cat.id))
      )
      .slice(0, 3);
    
    return relatedArticles;
  } catch (error) {
    console.error('Error fetching related articles:', error);
    return [];
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

  const relatedArticles = await getRelatedArticles(
    article.id,
    article.categories?.map(cat => cat.id) || []
  );

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
            <ShareButton article={article} />
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
            <ShareButton article={article} />
          </div>
        </footer>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="bg-gray-900 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-3xl font-bold text-white mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedArticles.map((relatedArticle) => (
                <RelatedArticleCard key={relatedArticle.id} article={relatedArticle} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Share Button Component
function ShareButton({ article }: { article: Article }) {
  const handleShare = async () => {
    const url = `${window.location.origin}/articles/${article.slug}`;
    const title = article.title;
    const text = article.excerpt || `Check out this article: ${title}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        alert('Article URL copied to clipboard!');
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      alert('Article URL copied to clipboard!');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
    >
      <ShareIcon className="w-5 h-5 mr-2" />
      Share
    </button>
  );
}

// Related Article Card Component
function RelatedArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
    >
      {article.coverImage && (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-gray-300 text-sm line-clamp-2 mb-3">{article.excerpt}</p>
        )}
        <div className="text-xs text-gray-400">
          {new Date(article.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
} 