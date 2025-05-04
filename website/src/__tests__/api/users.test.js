// Mock Next.js API route functions
const usersRoute = require('@/app/api/users/route');
const userIdRoute = require('@/app/api/users/[id]/route');
const db = require('@/lib/database');
const bcrypt = require('bcryptjs');

// Mock database and bcrypt modules
jest.mock('@/lib/database', () => ({
  query: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mocksalt'),
  hash: jest.fn().mockResolvedValue('hashedpassword'),
}));

// Mock Next.js Request and Response
const mockRequest = (method = 'GET', body = null) => {
  const req = {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    cookies: {
      get: jest.fn().mockReturnValue({ value: 'test-token' }),
    },
    json: jest.fn().mockResolvedValue(body),
  };
  return req;
};

// Mock context for [id] route handlers
const mockContext = (id = '1') => ({
  params: { id }
});

// Mock rate limiter
jest.mock('@/lib/rateLimit', () => ({
  rateLimit: () => ({
    check: jest.fn().mockResolvedValue(true),
  }),
}));

// Setup global NextResponse mock
global.NextResponse = {
  json: jest.fn().mockImplementation((data, options) => ({
    data,
    ...options,
  })),
};

describe('Users API', () => {
  // Get functions from route modules
  const { GET, POST } = usersRoute;
  const { GET: GetUser, PUT, DELETE } = userIdRoute;
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      // Mock users response
      const mockUsers = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 2,
          username: 'user1',
          email: 'user1@example.com',
          role: 'user',
          created_at: '2025-01-02T00:00:00.000Z',
          updated_at: '2025-01-02T00:00:00.000Z'
        }
      ];
      
      db.query.mockResolvedValueOnce(mockUsers);
      
      const req = mockRequest();
      const response = await GET(req);
      
      // Should return users array
      expect(response.data).toEqual(mockUsers);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT.*FROM users/),
        []
      );
    });

    it('should handle database errors', async () => {
      db.query.mockRejectedValueOnce(new Error('Database error'));
      
      const req = mockRequest();
      const response = await GET(req);
      
      // Should return error
      expect(response.data).toHaveProperty('message', 'Server error');
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      // Mock existing users check (empty array - no conflicts)
      db.query.mockResolvedValueOnce([]);
      // Mock insert result
      db.query.mockResolvedValueOnce({ insertId: 3 });
      
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user'
      };
      
      const req = mockRequest('POST', newUser);
      const response = await POST(req);
      
      // Should return success
      expect(response.data).toHaveProperty('message', 'User created successfully');
      expect(response.data).toHaveProperty('userId', 3);
      expect(response.status).toBe(201);
      
      // Verify bcrypt was called
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'mocksalt');
      
      // Verify insert query was called with correct data
      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO users/),
        ['newuser', 'newuser@example.com', 'hashedpassword', 'user']
      );
    });

    it('should reject creation if username or email exists', async () => {
      // Mock existing users check (conflict found)
      db.query.mockResolvedValueOnce([{ username: 'existinguser', email: 'existing@example.com' }]);
      
      const newUser = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123',
        role: 'user'
      };
      
      const req = mockRequest('POST', newUser);
      const response = await POST(req);
      
      // Should return error
      expect(response.data).toHaveProperty('message', 'Username or email already exists');
      expect(response.status).toBe(400);
      
      // Insert query should not be called
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('should validate required fields', async () => {
      const incompleteUser = {
        username: 'newuser',
        // Missing email and password
        role: 'user'
      };
      
      const req = mockRequest('POST', incompleteUser);
      const response = await POST(req);
      
      // Should return validation error
      expect(response.data).toHaveProperty('message', 'Username, email, and password are required');
      expect(response.status).toBe(400);
      
      // Database should not be queried
      expect(db.query).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/users/[id]', () => {
    it('should return a single user by ID', async () => {
      // Mock user response
      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };
      
      db.query.mockResolvedValueOnce([mockUser]);
      
      const req = mockRequest();
      const context = mockContext('1');
      const response = await GetUser(req, context);
      
      // Should return the user
      expect(response.data).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT.*FROM users WHERE id = \?/),
        ['1']
      );
    });

    it('should return 404 if user not found', async () => {
      // Mock empty response
      db.query.mockResolvedValueOnce([]);
      
      const req = mockRequest();
      const context = mockContext('999');
      const response = await GetUser(req, context);
      
      // Should return not found
      expect(response.data).toHaveProperty('message', 'User not found');
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/users/[id]', () => {
    it('should update a user', async () => {
      // Mock existing user
      db.query.mockResolvedValueOnce([{
        id: 2,
        username: 'user1',
        email: 'user1@example.com'
      }]);
      // Mock duplicate check (no conflicts)
      db.query.mockResolvedValueOnce([]);
      // Mock update result
      db.query.mockResolvedValueOnce({ affectedRows: 1 });
      
      const updateData = {
        username: 'updateduser',
        email: 'updated@example.com',
        role: 'admin'
      };
      
      const req = mockRequest('PUT', updateData);
      const context = mockContext('2');
      const response = await PUT(req, context);
      
      // Should return success
      expect(response.data).toHaveProperty('message', 'User updated successfully');
      
      // Verify update query was called with correct data
      expect(db.query).toHaveBeenCalledTimes(3);
      // Third call is the update query
      expect(db.query.mock.calls[2][0]).toContain('UPDATE users SET');
    });

    it('should update user password if provided', async () => {
      // Mock existing user
      db.query.mockResolvedValueOnce([{
        id: 2,
        username: 'user1',
        email: 'user1@example.com'
      }]);
      // Mock duplicate check (no conflicts)
      db.query.mockResolvedValueOnce([]);
      // Mock update result
      db.query.mockResolvedValueOnce({ affectedRows: 1 });
      
      const updateData = {
        username: 'user1',
        password: 'newpassword123'
      };
      
      const req = mockRequest('PUT', updateData);
      const context = mockContext('2');
      const response = await PUT(req, context);
      
      // Should return success
      expect(response.data).toHaveProperty('message', 'User updated successfully');
      
      // Verify bcrypt was called
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 'mocksalt');
    });

    it('should not allow duplicate email or username', async () => {
      // Mock existing user
      db.query.mockResolvedValueOnce([{
        id: 2,
        username: 'user1',
        email: 'user1@example.com'
      }]);
      // Mock duplicate check (conflict found)
      db.query.mockResolvedValueOnce([{
        id: 3,
        username: 'admin',
        email: 'admin@example.com'
      }]);
      
      const updateData = {
        username: 'admin', // Already exists for another user
        email: 'updated@example.com'
      };
      
      const req = mockRequest('PUT', updateData);
      const context = mockContext('2');
      const response = await PUT(req, context);
      
      // Should return error
      expect(response.data).toHaveProperty('message', 'Username or email already in use by another account');
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/users/[id]', () => {
    it('should delete a user', async () => {
      // Mock existing user with 'user' role
      db.query.mockResolvedValueOnce([{
        id: 2,
        username: 'user1',
        email: 'user1@example.com',
        role: 'user'
      }]);
      // Mock delete result
      db.query.mockResolvedValueOnce({ affectedRows: 1 });
      
      const req = mockRequest('DELETE');
      const context = mockContext('2');
      const response = await DELETE(req, context);
      
      // Should return success
      expect(response.data).toHaveProperty('message', 'User deleted successfully');
      
      // Verify delete query was called
      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = ?',
        ['2']
      );
    });

    it('should not allow deletion of admin users', async () => {
      // Mock existing admin user
      db.query.mockResolvedValueOnce([{
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      }]);
      
      const req = mockRequest('DELETE');
      const context = mockContext('1');
      const response = await DELETE(req, context);
      
      // Should return forbidden
      expect(response.data).toHaveProperty('message', 'Cannot delete admin user');
      expect(response.status).toBe(403);
      
      // Delete query should not be called
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if user not found', async () => {
      // Mock empty response (user not found)
      db.query.mockResolvedValueOnce([]);
      
      const req = mockRequest('DELETE');
      const context = mockContext('999');
      const response = await DELETE(req, context);
      
      // Should return not found
      expect(response.data).toHaveProperty('message', 'User not found');
      expect(response.status).toBe(404);
    });
  });
});
