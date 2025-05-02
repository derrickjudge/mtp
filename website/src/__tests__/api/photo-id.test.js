/**
 * Tests for photo ID API endpoints (GET, PUT, DELETE)
 */

// Use CommonJS require instead of ES import
const { GET, PUT, DELETE } = require('@/app/api/photos/[id]/route');

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
        if (sql.includes('photos') && params && params[0] === 1) {
          // Return first photo for ID 1
          return [mockQueryResults.photos[0]];
        } else if (sql.includes('photos') && params && params[0] === 999) {
          // Return empty for nonexistent photo ID
          return [];
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
            if (sql.includes('UPDATE')) {
              return [{ affectedRows: 1 }];
            } else if (sql.includes('DELETE')) {
              return [{ affectedRows: 1 }];
            } else if (sql.includes('SELECT') && params && params[0] === 1) {
              return [mockQueryResults.photos];
            } else if (sql.includes('tags')) {
              return [mockQueryResults.photoTags];
            }
            return [[]];
          }),
        });
      }),
    },
  };
});

describe('Photo ID API Endpoints', () => {
  const mockParams = { params: { id: '1' } };
  const nonExistentParams = { params: { id: '999' } };
  let mockRequest;
  
  beforeEach(() => {
    // Create a mock NextRequest
    mockRequest = {
      url: 'http://localhost:3000/api/photos/1',
      headers: new Headers(),
      json: jest.fn(),
    };
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  describe('GET /api/photos/[id]', () => {
    it('should return a single photo by ID', async () => {
      const response = await GET(mockRequest, mockParams);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id', 1);
      expect(data).toHaveProperty('title', 'Rock Concert');
      expect(data).toHaveProperty('category');
      expect(data).toHaveProperty('tags');
      expect(Array.isArray(data.tags)).toBe(true);
    });
    
    it('should handle invalid photo ID', async () => {
      const invalidParams = { params: { id: 'invalid' } };
      const response = await GET(mockRequest, invalidParams);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message', 'Invalid photo ID');
    });
    
    it('should handle non-existent photo', async () => {
      const response = await GET(mockRequest, nonExistentParams);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('message', 'Photo not found');
    });
    
    it('should handle rate limiting rejection', async () => {
      // Mock rate limiter to reject the request
      require('@/lib/rate-limiter').rateLimiter.mockResolvedValueOnce({ success: false });
      
      const response = await GET(mockRequest, mockParams);
      const data = await response.json();
      
      expect(response.status).toBe(429);
      expect(data).toHaveProperty('message', 'Rate limit exceeded');
    });
    
    it('should handle database errors', async () => {
      // Mock the db.query to throw an error
      require('@/lib/database').default.query.mockRejectedValueOnce(new Error('Database error'));
      
      const response = await GET(mockRequest, mockParams);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('message', 'Error fetching photo');
    });
  });
  
  describe('PUT /api/photos/[id]', () => {
    beforeEach(() => {
      // Mock the request body
      mockRequest.json = jest.fn().mockResolvedValue({
        title: 'Updated Photo',
        description: 'Updated description',
        categoryId: 1,
        tags: ['music', 'updated'],
      });
    });
    
    it('should update an existing photo', async () => {
      const response = await PUT(mockRequest, mockParams);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('category');
      expect(data).toHaveProperty('tags');
    });
    
    it('should handle invalid photo ID', async () => {
      const invalidParams = { params: { id: 'invalid' } };
      const response = await PUT(mockRequest, invalidParams);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message', 'Invalid photo ID');
    });
    
    it('should handle non-existent photo', async () => {
      const response = await PUT(mockRequest, nonExistentParams);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('message', 'Photo not found');
    });
    
    it('should handle rate limiting rejection', async () => {
      // Mock rate limiter to reject the request
      require('@/lib/rate-limiter').rateLimiter.mockResolvedValueOnce({ success: false });
      
      const response = await PUT(mockRequest, mockParams);
      const data = await response.json();
      
      expect(response.status).toBe(429);
      expect(data).toHaveProperty('message', 'Rate limit exceeded');
    });
    
    it('should handle database errors', async () => {
      // Mock transaction to throw error
      require('@/lib/database').default.transaction.mockRejectedValueOnce(new Error('Database error'));
      
      const response = await PUT(mockRequest, mockParams);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('message', 'Error updating photo');
    });
  });
  
  describe('DELETE /api/photos/[id]', () => {
    it('should delete an existing photo', async () => {
      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message', 'Photo deleted successfully');
    });
    
    it('should handle invalid photo ID', async () => {
      const invalidParams = { params: { id: 'invalid' } };
      const response = await DELETE(mockRequest, invalidParams);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message', 'Invalid photo ID');
    });
    
    it('should handle non-existent photo', async () => {
      const response = await DELETE(mockRequest, nonExistentParams);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('message', 'Photo not found');
    });
    
    it('should handle rate limiting rejection', async () => {
      // Mock rate limiter to reject the request
      require('@/lib/rate-limiter').rateLimiter.mockResolvedValueOnce({ success: false });
      
      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();
      
      expect(response.status).toBe(429);
      expect(data).toHaveProperty('message', 'Rate limit exceeded');
    });
    
    it('should handle database errors', async () => {
      // Mock transaction to throw error
      require('@/lib/database').default.transaction.mockRejectedValueOnce(new Error('Database error'));
      
      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('message', 'Error deleting photo');
    });
  });
});
