/**
 * Mock Database Module for Tests
 * 
 * This file provides a mock implementation of the database module to allow
 * tests to run without actual database connections.
 */

// Mock query function that can be customized in tests
const query = jest.fn();

// Define various mock results that can be used in tests
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: '$2a$10$XpC5o8BpJUgIMT.zCweEoeEi1dSKS.N978WY4.0TM9XCH0qOCi0zC', // hashed 'password123'
    role: 'admin'
  },
  {
    id: 2,
    username: 'user',
    email: 'user@example.com',
    password: '$2a$10$XpC5o8BpJUgIMT.zCweEoeEi1dSKS.N978WY4.0TM9XCH0qOCi0zC', // hashed 'password123'
    role: 'user'
  }
];

const mockPhotos = [
  { id: 1, title: 'Test Photo 1', description: 'Description 1', url: 'photo1.jpg', category_id: 1 },
  { id: 2, title: 'Test Photo 2', description: 'Description 2', url: 'photo2.jpg', category_id: 2 }
];

const mockCategories = [
  { id: 1, name: 'Category 1', slug: 'category-1' },
  { id: 2, name: 'Category 2', slug: 'category-2' }
];

// Default implementation returns empty array
query.mockImplementation(async () => []);

// Helper to set mock implementation for specific queries
const setQueryMockImplementation = (pattern, result) => {
  query.mockImplementation(async (sql, params) => {
    if (sql.includes(pattern)) {
      return result;
    }
    return [];
  });
};

// Reset all mocks
const resetMocks = () => {
  query.mockReset();
  query.mockImplementation(async () => []);
};

// Set up mock data for users
const setupUserMocks = () => {
  query.mockImplementation(async (sql, params) => {
    if (sql.includes('SELECT * FROM users')) {
      return mockUsers;
    }
    if (sql.includes('SELECT * FROM users WHERE id =')) {
      const userId = params?.[0] || 0;
      return mockUsers.filter(user => user.id === userId);
    }
    if (sql.includes('SELECT * FROM users WHERE username =')) {
      const username = params?.[0] || '';
      return mockUsers.filter(user => user.username === username);
    }
    return [];
  });
};

// Set up mock data for photos
const setupPhotoMocks = () => {
  query.mockImplementation(async (sql, params) => {
    if (sql.includes('SELECT * FROM photos')) {
      return mockPhotos;
    }
    if (sql.includes('SELECT * FROM photos WHERE id =')) {
      const photoId = params?.[0] || 0;
      return mockPhotos.filter(photo => photo.id === photoId);
    }
    return [];
  });
};

// Set up mock data for categories
const setupCategoryMocks = () => {
  query.mockImplementation(async (sql) => {
    if (sql.includes('SELECT * FROM categories')) {
      return mockCategories;
    }
    return [];
  });
};

module.exports = {
  query,
  setQueryMockImplementation,
  resetMocks,
  setupUserMocks,
  setupPhotoMocks,
  setupCategoryMocks,
  mockUsers,
  mockPhotos,
  mockCategories
};
