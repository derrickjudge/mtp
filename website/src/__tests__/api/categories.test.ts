/**
 * Tests for categories API endpoints
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/categories/route';

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
        if (sql.includes('categories')) {
          return mockQueryResults.categories;
        }
        return [];
      }),
      transaction: jest.fn().mockImplementation(async (callback) => {
        return callback({
          execute: jest.fn().mockResolvedValue([{ insertId: 999 }]),
        });
      }),
    },
    query: jest.fn().mockImplementation(async (sql, params) => {
      if (sql.includes('categories')) {
        return mockQueryResults.categories;
      }
      return [];
    }),
  };
});

describe('Categories API', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    // Create a mock NextRequest
    mockRequest = {
      url: 'http://localhost:3000/api/categories',
      headers: new Headers(),
      json: jest.fn(),
    } as unknown as NextRequest;
  });
  
  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      // Verify each category has the required fields
      data.forEach((category: any) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
      });
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
      require('@/lib/database').query.mockRejectedValueOnce(new Error('Database error'));
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('message', 'Error fetching categories');
    });
  });
  
  describe('POST /api/categories', () => {
    beforeEach(() => {
      // Mock the request body
      mockRequest.json = jest.fn().mockResolvedValue({
        name: 'New Category',
        description: 'New category description',
      });
    });
    
    it('should create a new category', async () => {
      // Mock empty result for existing category check
      require('@/lib/database').query.mockResolvedValueOnce([]);
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name', 'New Category');
      expect(data).toHaveProperty('description', 'New category description');
    });
    
    it('should reject when category name is missing', async () => {
      // Mock empty request body
      mockRequest.json = jest.fn().mockResolvedValue({});
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message', 'Category name is required');
    });
    
    it('should reject when category already exists', async () => {
      // Mock existing category result
      require('@/lib/database').query.mockResolvedValueOnce([{ id: 1, name: 'New Category' }]);
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(409);
      expect(data).toHaveProperty('message', 'Category with this name already exists');
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
      // Mock empty result for existing category check
      require('@/lib/database').query.mockResolvedValueOnce([]);
      
      // Mock the db.query to throw an error for the insert
      require('@/lib/database').query.mockRejectedValueOnce(new Error('Database error'));
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('message', 'Error creating category');
    });
  });
});
