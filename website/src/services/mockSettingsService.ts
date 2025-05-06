/**
 * Mock Settings Service
 * Provides mock settings data for development and testing
 */

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  socialMedia: {
    instagram: string;
    twitter: string;
    facebook: string;
  };
  metaTags: {
    title: string;
    description: string;
    keywords: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Default mock settings
const MOCK_SETTINGS: SiteSettings = {
  siteName: 'MTP Collective',
  siteDescription: 'A photography collective showcasing the best visual storytelling',
  contactEmail: 'contact@mtpcollective.com',
  logoUrl: '/images/logo.png',
  primaryColor: '#212121',
  secondaryColor: '#f5f5f5',
  socialMedia: {
    instagram: '@mtpcollective',
    twitter: '@mtpcollective',
    facebook: 'https://facebook.com/mtpcollective'
  },
  metaTags: {
    title: 'MTP Collective | Photography Portfolio',
    description: 'Discover extraordinary photography from the MTP Collective. Browse our curated collections of visual storytelling.',
    keywords: 'photography, portfolio, art, collective, visual storytelling, portraits, landscapes'
  }
};

/**
 * Get site settings
 */
export async function getSettings(): Promise<ApiResponse<SiteSettings>> {
  console.log('[MOCK-SETTINGS] Fetching site settings');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    success: true,
    data: MOCK_SETTINGS
  };
}

/**
 * Update site settings
 */
export async function updateSettings(newSettings: Partial<SiteSettings>): Promise<ApiResponse<SiteSettings>> {
  console.log('[MOCK-SETTINGS] Updating site settings');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real implementation, this would update the database
  // For mock purposes, merge the settings and return
  const updatedSettings = {
    ...MOCK_SETTINGS,
    ...newSettings,
    // Ensure nested objects are properly merged
    socialMedia: {
      ...MOCK_SETTINGS.socialMedia,
      ...(newSettings.socialMedia || {})
    },
    metaTags: {
      ...MOCK_SETTINGS.metaTags,
      ...(newSettings.metaTags || {})
    }
  };
  
  return {
    success: true,
    data: updatedSettings
  };
}
