import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { nativeDB } from '@/lib/db-native';
import { CalendarIcon, TagIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Articles | MTP Collective',
  description: 'Photography stories, behind-the-scenes content, and insights from MTP Collective. Explore our latest articles about concert photography, automotive shoots, and nature landscapes.',
  keywords: ['photography articles', 'behind the scenes', 'concert photography', 'automotive photography', 'nature photography', 'MTP Collective'],
  openGraph: {
    title: 'Articles | MTP Collective',
    description: 'Photography stories, behind-the-scenes content, and insights from MTP Collective.',
    type: 'website',
    url: '/articles',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Articles | MTP Collective',
    description: 'Photography stories, behind-the-scenes content, and insights from MTP Collective.',
  },
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
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

async function getArticles(): Promise<Article[]> {
  try {
    const articles = await nativeDB.findArticles({
      published: true,
      take: 50,
    });
    
    // Get articles with their categories and tags (same as API)
    const articlesWithRelations = await Promise.all(
      articles.map(async (article) => {
        const articleWithRelations = await nativeDB.getArticleWithRelations(article.id);
        return articleWithRelations;
      })
    );

    return articlesWithRelations;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const categories = await nativeDB.findCategories();
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const [articles, categories] = await Promise.all([
    getArticles(),
    getCategories(),
  ]);

  // Filter articles by category if specified
  const filteredArticles = searchParams.category
    ? articles.filter(article => 
        article.categories?.some(cat => cat.slug === searchParams.category)
      )
    : articles; // Show ALL articles when no category is selected

  // Separate featured and regular articles
  const featuredArticles = filteredArticles.filter(article => article.featured);
  const regularArticles = filteredArticles.filter(article => !article.featured);

  const selectedCategory = searchParams.category
    ? categories.find(cat => cat.slug === searchParams.category)
    : null;

  // Debug logging (remove in production)
  console.log('Articles fetched:', articles.length);
  console.log('Filtered articles:', filteredArticles.length);
  console.log('Featured articles:', featuredArticles.length);
  console.log('Regular articles:', regularArticles.length);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {selectedCategory ? `${selectedCategory.name} Articles` : 'Articles'}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {selectedCategory 
                ? `Explore our ${selectedCategory.name.toLowerCase()} photography stories and insights`
                : 'Behind-the-scenes stories, photography insights, and creative journeys from MTP Collective'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/articles"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !searchParams.category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All Articles
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/articles?category=${category.slug}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  searchParams.category === category.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Featured Articles</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredArticles.map((article) => (
                <FeaturedArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Regular Articles */}
        {regularArticles.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold text-white mb-8">
              {featuredArticles.length > 0 ? 'Latest Articles' : 'All Articles'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* No Articles */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-4">
              {searchParams.category 
                ? `No articles found in ${selectedCategory?.name || 'this category'}`
                : 'No articles published yet'
              }
            </div>
            <Link
              href="/articles"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              View all articles
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Featured Article Card Component
function FeaturedArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors"
    >
      {article.coverImage && (
        <div className="relative h-64 overflow-hidden">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 left-4">
            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Featured
            </span>
          </div>
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-gray-300 mb-4 overflow-hidden" style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical'
          }}>
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1" />
              {new Date(article.createdAt).toLocaleDateString()}
            </span>
            {article.categories && article.categories.length > 0 && (
              <span className="flex items-center">
                <TagIcon className="w-4 h-4 mr-1" />
                {article.categories[0].name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Regular Article Card Component
function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors"
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
        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-gray-300 mb-4 overflow-hidden" style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span className="flex items-center">
            <CalendarIcon className="w-4 h-4 mr-1" />
            {new Date(article.createdAt).toLocaleDateString()}
          </span>
          {article.categories && article.categories.length > 0 && (
            <span className="flex items-center">
              <TagIcon className="w-4 h-4 mr-1" />
              {article.categories[0].name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
} 