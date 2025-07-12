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
  console.log('🔍 [DEBUG] Starting getArticles() function');
  
  try {
    console.log('🔍 [DEBUG] Attempting to fetch articles from nativeDB.findArticles()');
    const articles = await nativeDB.findArticles({
      published: true,
      take: 50,
    });
    
    console.log('🔍 [DEBUG] Successfully fetched articles:', {
      count: articles.length,
      articleIds: articles.map(a => a.id),
      articleTitles: articles.map(a => a.title)
    });
    
    // Try to get articles with their categories and tags (same as API)
    try {
      console.log('🔍 [DEBUG] Attempting to fetch relations for articles');
      const articlesWithRelations = await Promise.all(
        articles.map(async (article, index) => {
          console.log(`🔍 [DEBUG] Fetching relations for article ${index + 1}/${articles.length}: ${article.title} (ID: ${article.id})`);
          const articleWithRelations = await nativeDB.getArticleWithRelations(article.id);
          console.log(`🔍 [DEBUG] Successfully fetched relations for article: ${article.title}`, {
            categoriesCount: articleWithRelations.categories?.length || 0,
            categories: articleWithRelations.categories?.map(c => c.name) || []
          });
          return articleWithRelations;
        })
      );
      
      console.log('🔍 [DEBUG] Successfully fetched all articles with relations:', {
        count: articlesWithRelations.length,
        articlesWithCategories: articlesWithRelations.filter(a => a.categories && a.categories.length > 0).length
      });
      
      return articlesWithRelations;
    } catch (relationError) {
      console.error('🚨 [ERROR] Failed to fetch article relations:', relationError);
      console.log('🔍 [DEBUG] Falling back to articles without categories');
      // Fallback: return articles without categories to ensure page isn't blank
      return articles;
    }
  } catch (error) {
    console.error('🚨 [ERROR] Critical error in getArticles():', error);
    console.log('🔍 [DEBUG] Returning empty array due to error');
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  console.log('🔍 [DEBUG] Starting getCategories() function');
  
  try {
    console.log('🔍 [DEBUG] Attempting to fetch categories from nativeDB.findCategories()');
    const categories = await nativeDB.findCategories();
    
    console.log('🔍 [DEBUG] Successfully fetched categories:', {
      count: categories.length,
      categoryNames: categories.map(c => c.name)
    });
    
    return categories;
  } catch (error) {
    console.error('🚨 [ERROR] Error fetching categories:', error);
    console.log('🔍 [DEBUG] Returning empty array due to error');
    return [];
  }
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  console.log('🔍 [DEBUG] ArticlesPage component starting to render');
  console.log('🔍 [DEBUG] Search params:', searchParams);
  
  try {
    console.log('🔍 [DEBUG] Fetching articles and categories in parallel');
    const [articles, categories] = await Promise.all([
      getArticles(),
      getCategories(),
    ]);
    
    console.log('🔍 [DEBUG] Successfully fetched data:', {
      articlesCount: articles.length,
      categoriesCount: categories.length,
      selectedCategory: searchParams.category
    });

    // Filter articles by category if specified
    const filteredArticles = searchParams.category
      ? articles.filter(article => {
          const hasCategory = article.categories?.some(cat => cat.slug === searchParams.category);
          console.log(`🔍 [DEBUG] Article "${article.title}" has category "${searchParams.category}": ${hasCategory}`);
          return hasCategory;
        })
      : articles; // Show ALL articles when no category is selected

    console.log('🔍 [DEBUG] Filtered articles:', {
      originalCount: articles.length,
      filteredCount: filteredArticles.length,
      filterApplied: !!searchParams.category
    });

    // Separate featured and regular articles
    const featuredArticles = filteredArticles.filter(article => article.featured);
    const regularArticles = filteredArticles.filter(article => !article.featured);

    console.log('🔍 [DEBUG] Article separation:', {
      featuredCount: featuredArticles.length,
      regularCount: regularArticles.length
    });

    const selectedCategory = searchParams.category
      ? categories.find(cat => cat.slug === searchParams.category)
      : null;

    console.log('🔍 [DEBUG] Selected category:', selectedCategory);
    console.log('🔍 [DEBUG] About to render ArticlesPage JSX');

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
          {/* Debug Info - Remove in production */}
          <div className="mb-8 p-4 bg-gray-800 rounded-lg text-sm text-gray-300">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <p>Total Articles: {articles.length}</p>
            <p>Filtered Articles: {filteredArticles.length}</p>
            <p>Featured Articles: {featuredArticles.length}</p>
            <p>Regular Articles: {regularArticles.length}</p>
            <p>Categories: {categories.length}</p>
            <p>Selected Category: {selectedCategory?.name || 'None'}</p>
          </div>

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
  } catch (error) {
    console.error('🚨 [ERROR] Critical error in ArticlesPage component:', error);
    
    // Return a fallback UI instead of crashing
    return (
      <div className="min-h-screen bg-black">
        <div className="bg-gradient-to-b from-gray-900 to-black py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Articles</h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Behind-the-scenes stories, photography insights, and creative journeys from MTP Collective
              </p>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <div className="text-red-400 text-lg mb-4">
              Unable to load articles at this time. Please try again later.
            </div>
            <div className="text-gray-400 text-sm">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </div>
        </div>
      </div>
    );
  }
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