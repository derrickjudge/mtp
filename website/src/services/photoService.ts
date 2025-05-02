/**
 * Service to interact with the photo API
 */

import { Photo } from '@/components/PortfolioScreen';

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
export async function getCategories(): Promise<ApiResponse<string[]>> {
  try {
    const response = await fetch('/api/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const categories = await response.json();
    return {
      success: true,
      data: categories.map((cat: any) => cat.name)
    };
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch categories'
    };
  }
}

/**
 * Fetch photos with optional category filter
 */
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
    
    const response = await fetch(`/api/photos?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform the data to match the expected Photo format
    const transformedPhotos = data.photos.map((photo: ApiPhoto) => {
      // Get file URL (handle both camelCase and snake_case)
      const fileUrl = photo.fileUrl || photo.file_url || '';
      
      // Extract category name
      let categoryName = 'Uncategorized';
      if (photo.category && typeof photo.category === 'object' && photo.category.name) {
        categoryName = photo.category.name;
      } else if (photo.category_name) {
        categoryName = photo.category_name;
      }
      
      return {
        id: String(photo.id), // Ensure consistent string ID format
        title: photo.title,
        description: photo.description || '',
        category: categoryName,
        imageUrl: fileUrl,
        width: photo.width || 1200,
        height: photo.height || 800
      };
    });
    
    return {
      success: true,
      data: {
        photos: transformedPhotos,
        pagination: data.pagination
      }
    };
  } catch (error: any) {
    console.error('Error fetching photos:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch photos'
    };
  }
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
    return {
      success: false,
      error: error.message || 'Failed to fetch photo'
    };
  }
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
