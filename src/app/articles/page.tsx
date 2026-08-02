import React from 'react';
import Link from 'next/link';
import { CalendarIcon, DocumentTextIcon, UserIcon } from '@heroicons/react/24/outline';
import { nativeDB } from '@/lib/db-native';
import { Image } from '@/components/common/Image';
import { getPageHeader } from '@/utils/pageHeaders';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Articles',
  description:
    'Behind-the-scenes stories, photography insights, and creative journeys from MTP Collective.',
  openGraph: {
    title: 'Articles | MTP Collective',
    description: 'Behind-the-scenes stories and photography insights from MTP Collective.',
  },
};

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  published: boolean;
  featured: boolean;
  authorName?: string | null;
  publishDate?: string | null;
  createdAt: string;
  categories?: Category[];
}

async function fetchArticles(categoryId?: string): Promise<Article[]> {
  try {
    return await nativeDB.findArticlesWithCategories({
      published: true,
      categoryId,
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

async function fetchCategories(): Promise<Category[]> {
  try {
    return await nativeDB.findCategories();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const categorySlug = searchParams?.category || '';

  // Categories are needed regardless, and the filter arrives as a slug (that is
  // what the article detail page links with) while the query takes an id.
  const categories = await fetchCategories();
  const selectedCategory = categorySlug
    ? categories.find((category) => category.slug === categorySlug)
    : undefined;

  const [articles, heroImage] = await Promise.all([
    fetchArticles(selectedCategory?.id),
    getPageHeader('articles'),
  ]);

  const featuredArticles = articles.filter((article) => article.featured);
  const regularArticles = articles.filter((article) => !article.featured);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative w-full" style={{ height: '40vh' }}>
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="MTP Collective Articles"
            fill
            priority
            sizes="100vw"
            className="object-cover brightness-75"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="font-display text-5xl md:text-6xl text-white mb-6 tracking-wider uppercase">
              Articles
            </h1>
            <p className="text-xl md:text-lg text-gray-200 font-light">
              Behind-the-scenes stories, photography insights, and creative journeys
            </p>
          </div>
        </div>
      </section>

      {/* Category filter — links so the selection lives in the URL and stays
          shareable, matching the portfolio page */}
      {categories.length > 0 && (
        <section className="py-4 bg-black border-b border-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-4 md:gap-6 text-sm">
              <Link
                href="/articles"
                className={`uppercase tracking-wider py-1 transition-colors ${
                  !selectedCategory
                    ? 'text-white font-semibold border-b-2 border-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/articles?category=${category.slug}`}
                  className={`uppercase tracking-wider py-1 transition-colors ${
                    selectedCategory?.id === category.id
                      ? 'text-white font-semibold border-b-2 border-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-12">
        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} featured />
              ))}
            </div>
          </section>
        )}

        {/* All Articles — gated on what this section actually renders, so a
            list of only featured articles doesn't produce an empty grid */}
        {regularArticles.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-8 text-center">
              {featuredArticles.length > 0 ? 'All Articles' : 'Recent Articles'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularArticles.map((article) => (
                <ArticleCard key={article.id} article={article} featured={false} />
              ))}
            </div>
          </section>
        )}

        {articles.length === 0 && (
          <div className="text-center py-16">
            <DocumentTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">
              {selectedCategory
                ? `No articles found in ${selectedCategory.name}`
                : 'No articles published yet'}
            </h3>
            <p className="text-gray-500">
              {selectedCategory
                ? 'Try another category, or view all articles.'
                : 'Check back soon for photography stories and insights!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The date an article should display: its editorial date, else when it was
 * created.
 *
 * Formatted in UTC deliberately. `publishDate` is date-only — the admin picks
 * it from a date input and it is stored at UTC midnight — so formatting in a
 * timezone behind UTC would render the previous day (a March 5 article showing
 * as March 4 in California). UTC also keeps the output identical wherever it
 * is rendered.
 */
function displayDate(article: Article): string {
  return new Date(article.publishDate || article.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function ArticleCard({ article, featured }: { article: Article; featured: boolean }) {
  return (
    <div
      className={`group bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors ${
        featured ? 'ring-2 ring-purple-500' : ''
      }`}
    >
      {article.coverImage && (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-6">
        {/* Outside the cover block so it still shows on articles without one */}
        {article.featured && (
          <span className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium mb-3">
            Featured
          </span>
        )}

        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
          <Link href={`/articles/${article.slug}`}>{article.title}</Link>
        </h3>

        {article.excerpt && <p className="text-gray-300 mb-4 line-clamp-3">{article.excerpt}</p>}

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

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
          <span className="flex items-center">
            <UserIcon className="w-4 h-4 mr-1" />
            {article.authorName || 'Anonymous Author'}
          </span>
          <span className="flex items-center">
            <CalendarIcon className="w-4 h-4 mr-1" />
            {displayDate(article)}
          </span>
        </div>
      </div>
    </div>
  );
}
