import { MetadataRoute } from 'next';
import { nativeDB } from '@/lib/db-native';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.mtpcollective.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Dynamic pages - Categories
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await nativeDB.findCategories();
    categoryPages = categories.map((category) => ({
      url: `${baseUrl}/portfolio?category=${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
  }

  // Dynamic pages - Events
  let eventPages: MetadataRoute.Sitemap = [];
  try {
    const events = await nativeDB.findEvents({ published: true });
    eventPages = events.map((event) => ({
      url: `${baseUrl}/events/${event.slug}`,
      lastModified: event.updatedAt ? new Date(event.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error fetching events for sitemap:', error);
  }

  return [...staticPages, ...categoryPages, ...eventPages];
}

