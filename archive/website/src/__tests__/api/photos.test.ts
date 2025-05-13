/**
 * Tests for photos API endpoints
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/photos/route';

// Mock the rate limiter
jest.mock('@/lib/rate-limiter', () => ({
  rateLimiter: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock the database module
jest.mock('@/lib/database', () => {
  const { mockQueryResults } = jest.requireMock('mysql2/promise');
  
  return {
    __esModule: true,
    default: {
      query: jest.fn().mockImplementation(async (sql, params) => {
        if (sql.includes('SELECT') && sql.includes('photos')) {
          return mockQueryResults.photos;
        } else if (sql.includes('COUNT')) {
          return [{ total: mockQueryResults.photos.length }];
        } else if (sql.includes('tags')) {
          return mockQueryResults.photoTags;
        } else if (sql.includes('categories')) {
          return mockQueryResults.categories;
        }
        return [];
      }),
      transaction: jest.fn().mockImplementation(async (callback) => {
        return callback({
          execute: jest.fn().mockImplementation(async (sql, params) => {
            if (sql.includes('INSERT INTO photos')) {
              return [{ insertId: 999 }];
            } else if (sql.includes('tags')) {
              return [mockQueryResults.photoTags];
            } else if (sql.includes('SELECT')) {
              return [mockQueryResults.photos];
            }
            return [[]];
          }),
        });
      }),
    },
    query: jest.fn().mockImplementation(async (sql, params) => {
      if (sql.includes('SELECT') && sql.includes('photos')) {
        return mockQueryResults.photos;
      } else if (sql.includes('COUNT')) {
        return [{ total: mockQueryResults.photos.length }];
      } else if (sql.includes('tags')) {
        return mockQueryResults.photoTags;
      } else if (sql.includes('categories')) {
        return mockQueryResults.categories;
      }
      return [];
    }),
  };
});

describe('Photos API', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    // Create a mock NextRequest with URL
    mockRequest = {
      url: 'http://localhost:3000/api/photos',
      headers: new Headers(),
      json: jest.fn(),
    } as unknown as NextRequest;
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  describe('GET /api/photos', () => {
    it('should return paginated photos', async () => {
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('photos');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.photos)).toBe(true);
      expect(data.photos.length).toBeGreaterThan(0);
      
      // Verify pagination properties
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('totalPages');
      
      // Verify photo structure
      data.photos.forEach((photo: any) => {
        expect(photo).toHaveProperty('id');
        expect(photo).toHaveProperty('title');
        expect(photo).toHaveProperty('description');
        expect(photo).toHaveProperty('category');
        expect(photo).toHaveProperty('tags');
        expect(Array.isArray(photo.tags)).toBe(true);
      });
    });
    
    it('should apply pagination parameters from URL', async () => {
      // Create request with pagination params
      const requestWithParams = {
        ...mockRequest,
        url: 'http://localhost:3000/api/photos?page=2&limit=10',
      } as unknown as NextRequest;
      
      const response = await GET(requestWithParams);
      await response.json();
      
      // Verify correct SQL was formed with pagination
      const dbQuery = require('@/lib/database').default.query;
      const queryCalls = dbQuery.mock.calls;
      
      // Find the main query call
      const mainQueryCall = queryCalls.find((call: any[]) => 
        call[0].includes('SELECT') && call[0].includes('photos') && !call[0].includes('COUNT')
      );
      
      expect(mainQueryCall).toBeDefined();
      expect(mainQueryCall[0]).toContain('LIMIT ? OFFSET ?');
      expect(mainQueryCall[1]).toContain(10); // limit
      expect(mainQueryCall[1]).toContain(10); // offset (page-1)*limit = (2-1)*10 = 10
    });
    
    it('should apply category filter from URL', async () => {
      // Create request with category param
      const requestWithCategory = {
        ...mockRequest,
        url: 'http://localhost:3000/api/photos?category=Concerts',
      } as unknown as NextRequest;
      
      const response = await GET(requestWithCategory);
      await response.json();
      
      // Verify correct SQL was formed with category filter
      const dbQuery = require('@/lib/database').default.query;
      const queryCalls = dbQuery.mock.calls;
      
      // Find the query call with category filtering
      const categoryQueryCall = queryCalls.find((call: any[]) => 
        call[0].includes('WHERE c.name = ?')
      );
      
      expect(categoryQueryCall).toBeDefined();
      expect(categoryQueryCall[1]).toContain('Concerts');
    });
    
    it('should handle rate limiting rejection', async () => {
      // Mock rate limiter to reject the request
      require('@/lib/rate-limiter').rateLimiter.mockResolvedValueOnce({ success: false });
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(429);
      expect(data).toHaveProperty('message', 'Rate limit exceeded');
    });
    
    it('should handle database errors', async () => {
      // Mock the db.query to throw an error
      require('@/lib/database').default.query.mockRejectedValueOnce(new Error('Database error'));
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('message', 'Error fetching photos');
    });
  });
  
  describe('POST /api/photos', () => {
    beforeEach(() => {
      // Mock the request body with photo data
      mockRequest.json = jest.fn().mockResolvedValue({
        title: 'New Photo',
        description: 'New photo description',
        categoryId: 1,
        tags: ['nature', 'landscape'],
        fileUrl: 'https://example.com/photo.jpg',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        width: 1200,
        height: 800
      });
    });
    
    it('should create a new photo', async () => {
      // Mock category check
      require('@/lib/database').query.mockResolvedValueOnce([{ id: 1, name: 'Concerts' }]);
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title', 'New Photo');
      expect(data).toHaveProperty('description', 'New photo description');
      expect(data).toHaveProperty('category');
    });
    
    it('should reject when required fields are missing', async () => {
      // Mock incomplete request body
      mockRequest.json = jest.fn().mockResolvedValue({
        title: 'New Photo',
        // Missing other required fields
      });
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message', 'Missing required fields');
    });
    
    it('should reject when category does not exist', async () => {
      // Mock empty category result
      require('@/lib/database').query.mockResolvedValueOnce([]);
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('message', 'Category not found');
    });
    
    it('should handle rate limiting rejection', async () => {
      // Mock rate limiter to reject the request
      require('@/lib/rate-limiter').rateLimiter.mockResolvedValueOnce({ success: false });
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(429);
      expect(data).toHaveProperty('message', 'Rate limit exceeded');
    });
    
    it('should handle database errors', async () => {
      // Mock category check success
      require('@/lib/database').query.mockResolvedValueOnce([{ id: 1, name: 'Concerts' }]);
      
      // Mock transaction to throw error
      require('@/lib/database').default.transaction.mockRejectedValueOnce(new Error('Database error'));
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('message', 'Error creating photo');
    });
  });
});
