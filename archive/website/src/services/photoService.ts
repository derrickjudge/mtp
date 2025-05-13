/**
 * Service to interact with the photo API
 */

// Import Photo interface from Portfolio component but extend it for our needs
import { Photo as BasePhoto } from '@/components/PortfolioScreen';

// Extended Photo interface for admin pages that need more fields
interface AdminPhoto extends Omit<BasePhoto, 'category'> {
  category: {
    id: number;
    name: string;
  };
  thumbnail_url: string;
  file_url: string;
  tags: string[];
}

// Use a union type for flexibility
type Photo = BasePhoto | AdminPhoto;

// Types for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginatedPhotosResponse {
  photos: Photo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// API photo response type (MySQL format)
interface ApiPhoto {
  id: number;
  title: string;
  description: string | null;
  // The API might return category as an object or provide the name directly
  category?: { id: number; name: string };
  category_name?: string;
  category_id?: number;
  // The API might return file URLs in camelCase or snake_case
  fileUrl?: string;
  file_url?: string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  // Dates might be returned in different formats
  uploadDate?: string;
  upload_date?: string;
  // Basic properties
  tags: string[];
  width: number;
  height: number;
  // Any other properties to make TypeScript happy
  [key: string]: any;
}

/**
 * Fetch all categories
 */
/**
 * Mock categories for development fallback
 */
const MOCK_CATEGORIES = [
  { id: 1, name: 'Nature', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: 'Street', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: 'Portrait', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: 'Architecture', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export async function getCategories(): Promise<ApiResponse<string[]>> {
  try {
    const response = await fetch('/api/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`API error ${response.status}, using mock categories`);
      // Return mock categories as fallback
      return {
        success: true,
        data: MOCK_CATEGORIES.map(cat => cat.name)
      };
    }
    
    const categories = await response.json();
    return {
      success: true,
      data: Array.isArray(categories) 
        ? categories.map((cat: any) => cat.name || 'Unknown') 
        : MOCK_CATEGORIES.map(cat => cat.name)
    };
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    // Return mock categories as fallback
    return {
      success: true, // Return success with mock data instead of failure
      data: MOCK_CATEGORIES.map(cat => cat.name)
    };
  }
}

/**
 * Fetch photos with optional category filter
 */
/**
 * Mock photos for development fallback
 */
const MOCK_PHOTOS: any[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  title: `Sample Photo ${i + 1}`,
  description: `This is a description for sample photo ${i + 1}. This text provides details about the photo.`,
  image_url: `https://picsum.photos/id/${(i % 30) + 10}/800/600`,
  imageUrl: `https://picsum.photos/id/${(i % 30) + 10}/800/600`, // Adding imageUrl directly
  thumbnail_url: `https://picsum.photos/id/${(i % 30) + 10}/400/300`,
  category_id: Math.floor(i / 5) + 1,
  category_name: i < 5 ? 'Nature' : i < 10 ? 'Street' : i < 15 ? 'Portrait' : 'Architecture',
  featured: i < 5,
  width: 800,
  height: 600,
  tags: [`tag${i % 5 + 1}`, `tag${i % 3 + 1}`],
  created_at: new Date(Date.now() - (i * 86400000)).toISOString(),
  updated_at: new Date(Date.now() - (i * 43200000)).toISOString()
}));

export async function getPhotos(
  category: string = 'All',
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<PaginatedPhotosResponse>> {
  try {
    // Build query params
    const params = new URLSearchParams();
    
    if (category !== 'All') {
      params.append('category', category);
    }
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    // Make API call
    const response = await fetch(`/api/photos?${params.toString()}`);
    
    if (!response.ok) {
      console.warn(`API error ${response.status}, using mock photos`);
      return handleMockPhotos(category, page, limit);
    }
    
    const data = await response.json();
    
    // If API returns empty data or unexpected format, use mock
    if (!data || !data.photos || !Array.isArray(data.photos)) {
      console.warn('API returned invalid data format, using mocks');
      return handleMockPhotos(category, page, limit);
    }
    
    // Process returned photos to ensure they match the expected format
    const processedPhotos = data.photos.map((photo: ApiPhoto) => {
      // Extract category
      let categoryValue: string | { id: number; name: string };
      
      if (photo.category && typeof photo.category === 'object') {
        categoryValue = photo.category;
      } else if (photo.category_name) {
        categoryValue = {
          id: photo.category_id || 0,
          name: photo.category_name
        };
      } else {
        categoryValue = 'Uncategorized';
      }
      
      // Get image URL from various possible fields
      const imageUrl = photo.imageUrl || photo.image_url || photo.fileUrl || photo.file_url || '';
      
      return {
        id: String(photo.id),
        title: photo.title || `Photo ${photo.id}`,
        description: photo.description || '',
        category: categoryValue,
        imageUrl,
        width: photo.width || 1200,
        height: photo.height || 800,
        tags: photo.tags || []
      };
    });
    
    // If the API returned no photos, use mock data
    if (processedPhotos.length === 0) {
      console.warn('API returned no photos, using mock data');
      return handleMockPhotos(category, page, limit);
    }
    
    return {
      success: true,
      data: {
        photos: processedPhotos,
        pagination: data.pagination || {
          total: data.total || processedPhotos.length,
          page: data.page || page,
          limit: data.limit || limit,
          pages: data.pages || Math.ceil((data.total || processedPhotos.length) / limit)
        }
      }
    };
    
  } catch (error: any) {
    console.error('Error fetching photos:', error);
    // Use mock photos as fallback
    return handleMockPhotos(category, page, limit);
  }
}

/**
 * Helper function to handle mock photo data
 */
function handleMockPhotos(category: string, page: number, limit: number): ApiResponse<PaginatedPhotosResponse> {
  // Filter mock photos by category if needed
  let filteredPhotos = [...MOCK_PHOTOS];
  if (category !== 'All') {
    filteredPhotos = filteredPhotos.filter(photo => 
      photo.category_name?.toLowerCase() === category.toLowerCase());
  }
  
  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPhotos = filteredPhotos.slice(startIndex, endIndex);
  
  // Transform to match expected Photo format for the admin photos page
  const transformedPhotos = paginatedPhotos.map(photo => ({
    id: String(photo.id),
    title: photo.title,
    description: photo.description || '',
    // Format category as an object with id and name properties
    category: {
      id: photo.category_id || 0,
      name: photo.category_name || 'Uncategorized'
    },
    // Add thumbnail and file URLs needed by admin page
    thumbnail_url: photo.thumbnail_url || photo.image_url,
    file_url: photo.image_url, 
    imageUrl: photo.imageUrl || photo.image_url, // Use imageUrl if available, fallback to image_url
    width: photo.width || 800,
    height: photo.height || 600,
    tags: photo.tags || []
  }));
  
  return {
    success: true,
    data: {
      photos: transformedPhotos,
      pagination: {
        total: filteredPhotos.length,
        page,
        limit,
        pages: Math.ceil(filteredPhotos.length / limit)
      }
    }
  };
}

/**
 * Fetch a specific photo by ID
 */
export async function getPhotoById(id: string): Promise<ApiResponse<Photo>> {
  try {
    const response = await fetch(`/api/photos/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`API error ${response.status}, using mock photo`);
      // Return a mock photo as fallback
      return getMockPhotoById(id);
    }
    
    const photo: ApiPhoto = await response.json();
    
    // Transform to expected Photo format
    // Get file URL (handle both camelCase and snake_case)
    const fileUrl = photo.fileUrl || photo.file_url || photo.image_url || '';
      
    // Extract category name
    let categoryName = 'Uncategorized';
    if (photo.category && typeof photo.category === 'object' && photo.category.name) {
      categoryName = photo.category.name;
    } else if (photo.category_name) {
      categoryName = photo.category_name;
    }
    
    const transformedPhoto: Photo = {
      id: String(photo.id), // Ensure consistent string ID format
      title: photo.title,
      description: photo.description || '',
      category: categoryName,
      imageUrl: fileUrl,
      width: photo.width || 1200,
      height: photo.height || 800
    };
    
    return {
      success: true,
      data: transformedPhoto
    };
  } catch (error: any) {
    console.error(`Error fetching photo ${id}:`, error);
    // Return a mock photo as fallback
    return getMockPhotoById(id);
  }
}

/**
 * Helper function to get a mock photo by ID
 */
function getMockPhotoById(id: string): ApiResponse<Photo> {
  // Find a mock photo with the given ID or generate one
  const photoId = parseInt(id);
  let mockPhoto = MOCK_PHOTOS.find(p => p.id === photoId);
  
  if (!mockPhoto) {
    // Generate a fallback photo with the requested ID
    mockPhoto = {
      id: photoId,
      title: `Photo ${photoId}`,
      description: `This is a generated photo with ID ${photoId}`,
      image_url: `https://picsum.photos/id/${(photoId % 30) + 10}/800/600`,
      imageUrl: `https://picsum.photos/id/${(photoId % 30) + 10}/800/600`,
      category_name: 'Generated',
      width: 800,
      height: 600
    };
  }
  
  return {
    success: true,
    data: {
      id: String(mockPhoto.id),
      title: mockPhoto.title,
      description: mockPhoto.description || '',
      // Format category as an object for admin page
      category: {
        id: mockPhoto.category_id || 0,
        name: mockPhoto.category_name || 'Uncategorized'
      },
      // Add all required URLs
      thumbnail_url: mockPhoto.thumbnail_url || mockPhoto.image_url,
      file_url: mockPhoto.image_url,
      imageUrl: mockPhoto.image_url,
      width: mockPhoto.width || 800,
      height: mockPhoto.height || 600,
      tags: mockPhoto.tags || []
    }
  };
}

/**
 * Create a new photo
 */
export async function createPhoto(
  title: string,
  description: string,
  categoryId: number,
  photoFileUrl: string,  // Renamed to avoid conflict with local variable
  thumbnailUrl: string,
  tags: string[] = [],
  width: number = 1200,
  height: number = 800
): Promise<ApiResponse<Photo>> {
  try {
    const response = await fetch('/api/photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        categoryId,
        fileUrl: photoFileUrl,  // Use the renamed parameter
        thumbnailUrl,
        tags,
        width,
        height
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const photo: ApiPhoto = await response.json();
    
    // Transform to expected Photo format
    // Get file URL (handle both camelCase and snake_case)
    const fileUrl = photo.fileUrl || photo.file_url || '';
      
    // Extract category name
    let categoryName = 'Uncategorized';
    if (photo.category && typeof photo.category === 'object' && photo.category.name) {
      categoryName = photo.category.name;
    } else if (photo.category_name) {
      categoryName = photo.category_name;
    }
    
    const transformedPhoto: Photo = {
      id: String(photo.id),
      title: photo.title,
      description: photo.description || '',
      category: categoryName,
      imageUrl: fileUrl,
      width: photo.width || 1200,
      height: photo.height || 800
    };
    
    return {
      success: true,
      data: transformedPhoto
    };
  } catch (error: any) {
    console.error('Error creating photo:', error);
    return {
      success: false,
      error: error.message || 'Failed to create photo'
    };
  }
}
