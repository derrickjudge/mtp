/**
 * Integration tests for a complete photo flow
 * Tests the complete lifecycle of a photo: create, read, update, delete
 */

// Use CommonJS require instead of ES import
const { POST } = require('@/app/api/photos/route');
const { GET, PUT, DELETE } = require('@/app/api/photos/[id]/route');

// Mock the rate limiter
jest.mock('@/lib/rate-limiter', () => ({
  rateLimiter: jest.fn().mockResolvedValue({ success: true }),
}));

// Set up a more sophisticated database mock for integration testing
jest.mock('@/lib/database', () => {
  // In-memory database for the integration test
  const inMemoryDb = {
    photos: [],
    categories: [
      { id: 1, name: 'Concerts', description: 'Concert photography' },
      { id: 2, name: 'Sports', description: 'Sports photography' },
    ],
    tags: ['music', 'rock', 'sports'],
    photoTags: []
  };
  
  // Mock last insert ID
  let lastInsertId = 0;
  
  // Transaction mock that actually performs the operations on in-memory data
  const mockTransaction = async (callback) => {
    try {
      const result = await callback({
        execute: jest.fn().mockImplementation(async (sql, params) => {
          // Handle photo insertion
          if (sql.includes('INSERT INTO photos')) {
            const newPhoto = {
              id: ++lastInsertId,
              title: params[0],
              description: params[1],
              category_id: params[2],
              file_url: params[3],
              thumbnail_url: params[4],
              width: params[5],
              height: params[6],
              upload_date: params[7],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              category_name: inMemoryDb.categories.find(c => c.id === params[2])?.name || 'Unknown'
            };
            inMemoryDb.photos.push(newPhoto);
            return [{ insertId: newPhoto.id, affectedRows: 1 }];
          }
          
          // Handle photo update
          if (sql.includes('UPDATE photos') && sql.includes('WHERE id = ?')) {
            const photoId = params[params.length - 1];
            const photoIndex = inMemoryDb.photos.findIndex(p => p.id === photoId);
            
            if (photoIndex !== -1) {
              // Update photo properties based on the query
              const photo = inMemoryDb.photos[photoIndex];
              
              if (sql.includes('title = ?')) {
                const titleIndex = sql.split('?').indexOf('title = ') + 1;
                photo.title = params[titleIndex - 1];
              }
              
              if (sql.includes('description = ?')) {
                const descIndex = sql.split('?').indexOf('description = ') + 1;
                photo.description = params[descIndex - 1];
              }
              
              photo.updated_at = new Date().toISOString();
              return [{ affectedRows: 1 }];
            }
            return [{ affectedRows: 0 }];
          }
          
          // Handle photo deletion
          if (sql.includes('DELETE FROM photos WHERE id = ?')) {
            const photoId = params[0];
            const initialLength = inMemoryDb.photos.length;
            inMemoryDb.photos = inMemoryDb.photos.filter(p => p.id !== photoId);
            return [{ affectedRows: initialLength - inMemoryDb.photos.length }];
          }
          
          // Handle photo by ID
          if (sql.includes('SELECT') && sql.includes('FROM photos') && 
              sql.includes('WHERE p.id = ?')) {
            const photoId = params[0];
            const photo = inMemoryDb.photos.find(p => p.id === photoId);
            return photo ? [[photo]] : [[]];
          }
          
          // Return default values for other queries
          return [[]];
        }),
      });
      return result;
    } catch (error) {
      throw error;
    }
  };
  
  // Return the full mock
  return {
    __esModule: true,
    default: {
      query: jest.fn().mockImplementation(async (sql, params) => {
        // Check for category ID
        if (sql.includes('SELECT * FROM categories WHERE id = ?')) {
          const categoryId = params[0];
          return inMemoryDb.categories.filter(c => c.id === categoryId);
        }
        
        // Return photos by ID
        if (sql.includes('SELECT') && sql.includes('FROM photos') && 
            sql.includes('WHERE p.id = ?')) {
          const photoId = params[0];
          const photo = inMemoryDb.photos.find(p => p.id === photoId);
          return photo ? [photo] : [];
        }
        
        // Return all photos
        if (sql.includes('SELECT') && sql.includes('FROM photos') && 
            !sql.includes('WHERE')) {
          return inMemoryDb.photos;
        }
        
        // Return tags for a photo
        if (sql.includes('SELECT') && sql.includes('tags') && 
            sql.includes('WHERE pt.photo_id = ?')) {
          return inMemoryDb.tags.map(t => ({ name: t }));
        }
        
        return [];
      }),
      transaction: mockTransaction,
    },
    query: jest.fn().mockImplementation(async (sql, params) => {
      // Same implementations as above for standalone queries
      if (sql.includes('SELECT * FROM categories WHERE id = ?')) {
        const categoryId = params[0];
        return inMemoryDb.categories.filter(c => c.id === categoryId);
      }
      
      if (sql.includes('SELECT') && sql.includes('FROM photos') && 
          sql.includes('WHERE p.id = ?')) {
        const photoId = params[0];
        const photo = inMemoryDb.photos.find(p => p.id === photoId);
        return photo ? [photo] : [];
      }
      
      if (sql.includes('SELECT') && sql.includes('FROM photos') && 
          !sql.includes('WHERE')) {
        return inMemoryDb.photos;
      }
      
      if (sql.includes('SELECT') && sql.includes('tags') && 
          sql.includes('WHERE pt.photo_id = ?')) {
        return inMemoryDb.tags.map(t => ({ name: t }));
      }
      
      return [];
    }),
    inMemoryDb // Expose for test assertions
  };
});

describe('Photo API Integration Flow', () => {
  let mockRequest;
  let createdPhotoId;
  
  beforeEach(() => {
    // Reset in-memory database state between tests
    const dbModule = jest.requireMock('@/lib/database');
    dbModule.inMemoryDb.photos = [];
    dbModule.inMemoryDb.photoTags = [];
    
    // Reset mock calls
    jest.clearAllMocks();
  });
  
  it('should handle the complete lifecycle of a photo', async () => {
    // STEP 1: Create a new photo
    mockRequest = {
      url: 'http://localhost:3000/api/photos',
      headers: new Headers(),
      json: jest.fn().mockResolvedValue({
        title: 'Integration Test Photo',
        description: 'Created during integration test',
        categoryId: 1,
        tags: ['test', 'integration'],
        fileUrl: 'https://example.com/test-photo.jpg',
        thumbnailUrl: 'https://example.com/test-thumbnail.jpg',
        width: 1200,
        height: 800
      }),
    };
    
    let response = await POST(mockRequest);
    let data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('title', 'Integration Test Photo');
    
    // Store created photo ID for next steps
    createdPhotoId = data.id;
    
    // STEP 2: Get the created photo
    mockRequest = {
      url: `http://localhost:3000/api/photos/${createdPhotoId}`,
      headers: new Headers(),
    };
    
    const params = { params: { id: String(createdPhotoId) } };
    
    response = await GET(mockRequest, params);
    data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id', createdPhotoId);
    expect(data).toHaveProperty('title', 'Integration Test Photo');
    
    // STEP 3: Update the photo
    mockRequest = {
      url: `http://localhost:3000/api/photos/${createdPhotoId}`,
      headers: new Headers(),
      json: jest.fn().mockResolvedValue({
        title: 'Updated Test Photo',
        description: 'Updated during integration test',
      }),
    };
    
    response = await PUT(mockRequest, params);
    data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('title', 'Updated Test Photo');
    expect(data).toHaveProperty('description', 'Updated during integration test');
    
    // STEP 4: Delete the photo
    mockRequest = {
      url: `http://localhost:3000/api/photos/${createdPhotoId}`,
      headers: new Headers(),
    };
    
    response = await DELETE(mockRequest, params);
    data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('message', 'Photo deleted successfully');
    
    // STEP 5: Verify photo no longer exists
    mockRequest = {
      url: `http://localhost:3000/api/photos/${createdPhotoId}`,
      headers: new Headers(),
    };
    
    response = await GET(mockRequest, params);
    data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data).toHaveProperty('message', 'Photo not found');
  });
});
