/**
 * Mock Photo Service
 * Provides mock photo data for development and testing
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Photo {
  id: number;
  title: string;
  description: string;
  image_url: string;
  thumbnail_url: string;
  category_id: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  tags?: string[];
  // For admin UI compatibility
  category: {
    id: number;
    name: string;
  };
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

// Create category lookup function for reuse
const getCategoryById = (id: number) => {
  const category = MOCK_CATEGORIES.find(cat => cat.id === id);
  return category || { id: 0, name: 'Uncategorized', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
};

// Sample mock photos
const MOCK_PHOTOS: Photo[] = Array.from({ length: 20 }, (_, i) => {
  const categoryId = Math.floor(i / 5) + 1;
  return {
    id: i + 1,
    title: `Sample Photo ${i + 1}`,
    description: `This is a description for sample photo ${i + 1}. This text provides details about the photo.`,
    image_url: `https://picsum.photos/id/${(i % 30) + 10}/800/600`,
    thumbnail_url: `https://picsum.photos/id/${(i % 30) + 10}/400/300`,
    category_id: categoryId,
    featured: i < 5,
    created_at: new Date(Date.now() - (i * 86400000)).toISOString(),
    updated_at: new Date(Date.now() - (i * 43200000)).toISOString(),
    tags: [`tag${i % 3 + 1}`, `cat-${categoryId}`],
    // Add category object required by Photo interface
    category: {
      id: categoryId,
      name: ['Nature', 'Street', 'Portrait', 'Architecture'][categoryId - 1] || 'Uncategorized'
    }
  };
});

// Sample mock categories
const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Nature', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: 'Street', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: 'Portrait', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: 'Architecture', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

/**
 * Get photos with pagination and optional filtering
 */
export async function getPhotos(page: number = 1, limit: number = 12, categoryId?: number): Promise<{ photos: Photo[], total: number }> {
  console.log('[MOCK-PHOTOS] Fetching photos:', { page, limit, categoryId });
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let filteredPhotos = [...MOCK_PHOTOS];
  
  // Apply category filter if provided
  if (categoryId) {
    filteredPhotos = filteredPhotos.filter(photo => photo.category_id === categoryId);
  }
  
  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPhotos = filteredPhotos.slice(startIndex, endIndex);
  
  // Add proper category format for admin UI
  const photosWithCategories = paginatedPhotos.map(photo => {
    const categoryName = MOCK_CATEGORIES.find(cat => cat.id === photo.category_id)?.name || 'Uncategorized';
    const categoryId = photo.category_id || 0;
    
    return {
      ...photo,
      category: {
        id: categoryId,
        name: categoryName
      },
      // Also add tags if missing
      tags: photo.tags || [`cat-${categoryId}`, 'mock']
    };
  });
  
  return {
    photos: photosWithCategories,
    total: filteredPhotos.length
  };
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  console.log('[MOCK-PHOTOS] Fetching categories');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return MOCK_CATEGORIES;
}

/**
 * Get featured photos
 */
export async function getFeaturedPhotos(limit: number = 5): Promise<Photo[]> {
  console.log('[MOCK-PHOTOS] Fetching featured photos');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 250));
  
  const featuredPhotos = MOCK_PHOTOS.filter(photo => photo.featured).slice(0, limit);
  
  // Get featured photos with proper category formatting for admin UI
  return featuredPhotos.map(photo => {
    const categoryName = MOCK_CATEGORIES.find(cat => cat.id === photo.category_id)?.name || 'Uncategorized';
    const categoryId = photo.category_id || 0;
    
    return {
      ...photo,
      category: {
        id: categoryId,
        name: categoryName
      },
      // Also add tags if missing
      tags: photo.tags || [`cat-${categoryId}`, 'featured']
    };
  });
}

/**
 * Get a single photo by ID
 * @param id - The photo ID (can be string or number)
 */
export async function getPhotoById(id: string | number): Promise<ApiResponse<Photo>> {
  console.log(`[MOCK-PHOTOS] Fetching photo by ID: ${id}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Convert string to number if needed
  const numericId = typeof id === 'string' ? parseInt(id) : id;
  
  // Handle invalid ID
  if (isNaN(numericId)) {
    return {
      success: false,
      error: 'Invalid photo ID'
    };
  }
  
  const photo = MOCK_PHOTOS.find(p => p.id === numericId);
  
  if (!photo) {
    // If not found, create a fallback for testing
    if (process.env.NODE_ENV !== 'production') {
      // Create a fallback mock photo with the requested ID
      const categoryId = (numericId % 4) + 1;
      const categoryName = MOCK_CATEGORIES.find(cat => cat.id === categoryId)?.name || 'Uncategorized';
      
      return {
        success: true,
        data: {
          id: numericId,
          title: `Generated Photo ${numericId}`,
          description: `This is an auto-generated mock photo with ID ${numericId}`,
          image_url: `https://picsum.photos/id/${(numericId % 30) + 10}/800/600`,
          thumbnail_url: `https://picsum.photos/id/${(numericId % 30) + 10}/400/300`,
          category_id: categoryId,
          featured: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: ['generated', `id-${numericId}`],
          category: {
            id: categoryId,
            name: categoryName
          }
        }
      };
    }
    
    return {
      success: false,
      error: 'Photo not found'
    };
  }
  
  const categoryName = MOCK_CATEGORIES.find(cat => cat.id === photo.category_id)?.name || 'Uncategorized';
  const categoryId = photo.category_id || 0;
  
  return {
    success: true,
    data: {
      ...photo,
      category: {
        id: categoryId,
        name: categoryName
      },
      tags: photo.tags || [`cat-${categoryId}`, 'mock']
    }
  };
}
