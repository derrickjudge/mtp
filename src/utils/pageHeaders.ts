import { nativeDB } from '@/lib/db-native';

// Default hero images for each page
export const DEFAULT_HEADERS: Record<string, string> = {
  home: '/images/hero/hero.jpg',
  about: '/images/hero/about.jpg',
  portfolio: '/images/hero/portfolio.jpg',
  events: '/images/hero/hero.jpg',
  articles: '/images/hero/hero.jpg',
  contact: '/images/hero/contact.jpg',
  services: '/images/hero/services.jpg'
};

export type PageName = keyof typeof DEFAULT_HEADERS;

/**
 * Get the header image URL for a specific page.
 * Returns custom header if set, otherwise returns default.
 * For use in Server Components.
 */
export async function getPageHeader(page: PageName): Promise<string> {
  const key = `header:${page}`;
  
  try {
    const setting = await nativeDB.getSetting(key);
    if (setting?.value) {
      return setting.value;
    }
  } catch (error) {
    console.error(`Error fetching header for ${page}:`, error);
  }
  
  return DEFAULT_HEADERS[page] || DEFAULT_HEADERS.home;
}

/**
 * Get all page headers at once (more efficient for SSR)
 * For use in Server Components.
 */
export async function getAllPageHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  
  try {
    const settings = await nativeDB.getSettingsByPrefix('header:');
    for (const setting of settings) {
      const page = setting.key.replace('header:', '');
      if (setting.value) {
        headers[page] = setting.value;
      }
    }
  } catch (error) {
    console.error('Error fetching page headers:', error);
  }
  
  return headers;
}

