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
  /** Plain-text opening of the body, used when there is no excerpt. */
  contentSnippet?: string | null;
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

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Shown only when arriving from a category link on an article, so the
            filtered view is explained and escapable. There is no category
            browse UI on this page. */}
        {selectedCategory && (
          <div className="flex items-center gap-3 text-sm text-gray-400 mb-8 pb-6 border-b border-gray-800">
            <span>
              Showing articles in{' '}
              <span className="text-blue-300">{selectedCategory.name}</span>
            </span>
            <Link href="/articles" className="text-gray-400 hover:text-white underline">
              View all articles
            </Link>
          </div>
        )}

        {/* One flat list: the query returns featured first, then newest */}
        {articles.map((article) => (
          <ArticleRow key={article.id} article={article} />
        ))}

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

/** Preview text: the editorial excerpt, else the opening of the body. */
function previewText(article: Article): string | null {
  const excerpt = article.excerpt?.trim();
  if (excerpt) return excerpt;

  const snippet = article.contentSnippet?.trim();
  if (!snippet) return null;
  // The snippet is cut to a fixed length in SQL, so it may end mid-word
  return snippet.length >= 300 ? `${snippet.replace(/\s+\S*$/, '')}...` : snippet;
}

function ArticleRow({ article }: { article: Article }) {
  const href = `/articles/${article.slug}`;
  const preview = previewText(article);

  return (
    <article className="group py-8 border-b border-gray-800 last:border-b-0">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
        <Link href={href} className="hover:text-blue-400 transition-colors">
          {article.title}
        </Link>
      </h2>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm uppercase tracking-wide text-gray-400 mb-6">
        <span>{displayDate(article)}</span>
        <span aria-hidden="true">by</span>
        <span className="text-gray-200">{article.authorName || 'Anonymous Author'}</span>
        {article.featured && (
          <>
            <span aria-hidden="true" className="text-gray-600">
              |
            </span>
            <span className="text-purple-300 normal-case tracking-normal">Featured</span>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {article.coverImage && (
          <Link
            href={href}
            className="sm:w-2/5 flex-shrink-0 relative aspect-[4/3] overflow-hidden rounded"
          >
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 40vw"
            />
          </Link>
        )}

        {preview && (
          <p className="flex-1 text-lg leading-relaxed text-gray-300">
            {preview}{' '}
            <Link href={href} className="text-blue-400 hover:text-blue-300 whitespace-nowrap">
              Read more
            </Link>
          </p>
        )}
      </div>
    </article>
  );
}
