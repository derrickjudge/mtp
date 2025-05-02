/**
 * Mock implementation of mysql2/promise
 */

// Mock query results for different queries
const mockQueryResults = {
  // Categories
  categories: [
    { id: 1, name: 'Concerts', description: 'Concert photography' },
    { id: 2, name: 'Sports', description: 'Sports photography' },
    { id: 3, name: 'Street', description: 'Street photography' },
  ],
  // Photos
  photos: [
    { 
      id: 1, 
      title: 'Rock Concert', 
      description: 'Live performance', 
      category_id: 1,
      file_url: 'https://example.com/photo1.jpg',
      thumbnail_url: 'https://example.com/thumbnail1.jpg',
      width: 1200,
      height: 800,
      upload_date: new Date('2025-01-01').toISOString(),
      created_at: new Date('2025-01-01').toISOString(),
      updated_at: new Date('2025-01-01').toISOString(),
      category_name: 'Concerts'
    },
    { 
      id: 2, 
      title: 'Basketball Game', 
      description: 'Championship game', 
      category_id: 2,
      file_url: 'https://example.com/photo2.jpg',
      thumbnail_url: 'https://example.com/thumbnail2.jpg',
      width: 1200,
      height: 800,
      upload_date: new Date('2025-01-02').toISOString(),
      created_at: new Date('2025-01-02').toISOString(),
      updated_at: new Date('2025-01-02').toISOString(),
      category_name: 'Sports'
    },
  ],
  // Photo tags
  photoTags: [
    { name: 'music' },
    { name: 'rock' },
    { name: 'live' },
  ],
  // Default result for SELECT 1
  connectionTest: [{ '1': 1 }]
};

// Track mock calls for assertions
const mockCalls = {
  query: [],
  execute: [],
  beginTransaction: [],
  commit: [],
  rollback: [],
  release: [],
  end: []
};

// Mock connection object
const mockConnection = {
  query: jest.fn(async (sql, params) => {
    mockCalls.query.push({ sql, params });
    
    // Return results based on the SQL query
    if (sql.includes('categories')) {
      return [mockQueryResults.categories];
    } else if (sql.includes('photos') && !sql.includes('photo_tags')) {
      return [mockQueryResults.photos];
    } else if (sql.includes('tags') || sql.includes('photo_tags')) {
      return [mockQueryResults.photoTags];
    } else if (sql === 'SELECT 1') {
      return [mockQueryResults.connectionTest];
    } else if (sql.includes('COUNT')) {
      return [{ total: mockQueryResults.photos.length }];
    }
    
    return [[]];
  }),
  execute: jest.fn(async (sql, params) => {
    mockCalls.execute.push({ sql, params });
    
    // For INSERT queries, return an object with insertId
    if (sql.includes('INSERT')) {
      return [{ insertId: 999, affectedRows: 1 }];
    }
    
    // For DELETE queries, return affected rows
    if (sql.includes('DELETE')) {
      return [{ affectedRows: 1 }];
    }
    
    // For UPDATE queries, return affected rows
    if (sql.includes('UPDATE')) {
      return [{ affectedRows: 1 }];
    }
    
    // For SELECT queries, handle like the query method
    if (sql.includes('categories')) {
      return [mockQueryResults.categories];
    } else if (sql.includes('photos') && !sql.includes('photo_tags')) {
      return [mockQueryResults.photos];
    } else if (sql.includes('tags') || sql.includes('photo_tags')) {
      return [mockQueryResults.photoTags];
    }
    
    return [[]];
  }),
  beginTransaction: jest.fn(async () => {
    mockCalls.beginTransaction.push({});
    return Promise.resolve();
  }),
  commit: jest.fn(async () => {
    mockCalls.commit.push({});
    return Promise.resolve();
  }),
  rollback: jest.fn(async () => {
    mockCalls.rollback.push({});
    return Promise.resolve();
  }),
  release: jest.fn(() => {
    mockCalls.release.push({});
  }),
  end: jest.fn(() => {
    mockCalls.end.push({});
    return Promise.resolve();
  })
};

// Mock pool object
const mockPool = {
  getConnection: jest.fn(async () => {
    return mockConnection;
  }),
  query: jest.fn(async (sql, params) => {
    return mockConnection.query(sql, params);
  }),
  execute: jest.fn(async (sql, params) => {
    return mockConnection.execute(sql, params);
  }),
  end: jest.fn(async () => {
    return mockConnection.end();
  })
};

// Mock createPool function
const createPool = jest.fn((config) => {
  return mockPool;
});

// Export mock functions and objects
module.exports = {
  createPool,
  mockPool,
  mockConnection,
  mockCalls,
  mockQueryResults,
  // Helper to reset all mock call tracking
  __resetMockCalls: () => {
    Object.keys(mockCalls).forEach(key => {
      mockCalls[key] = [];
    });
    createPool.mockClear();
    mockPool.getConnection.mockClear();
    mockPool.query.mockClear();
    mockPool.execute.mockClear();
    mockPool.end.mockClear();
    mockConnection.query.mockClear();
    mockConnection.execute.mockClear();
    mockConnection.beginTransaction.mockClear();
    mockConnection.commit.mockClear();
    mockConnection.rollback.mockClear();
    mockConnection.release.mockClear();
    mockConnection.end.mockClear();
  }
};
