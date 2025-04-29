import { dbConnect } from '../../lib/dbConnect';

// Mock mongoose
jest.mock('mongoose', () => {
  const mockMongoose = {
    connect: jest.fn().mockImplementation(() => Promise.resolve(mockMongoose)),
  };
  return mockMongoose;
});

// Get the mocked mongoose instance
const mongoose = require('mongoose');

describe('Database Connection Utility Tests', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset the global mongoose object before each test
    // @ts-ignore - Accessing global object for testing
    global.mongoose = {
      conn: null,
      promise: null
    };
  });

  // Test initial connection
  it('should connect to the database on first call', async () => {
    const conn = await dbConnect();
    
    // Mongoose connect should be called once
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    
    // Should use the correct connection string
    expect(mongoose.connect).toHaveBeenCalledWith(
      expect.stringContaining('mongodb://'),
      expect.objectContaining({
        bufferCommands: false
      })
    );
    
    // Should return a connection
    expect(conn).toBeDefined();
  });

  // Test connection reuse
  it('should reuse existing connection on subsequent calls', async () => {
    // First connection
    await dbConnect();
    
    // Second connection
    await dbConnect();
    
    // Mongoose connect should still only be called once
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
  });

  // Test connection with existing promise
  it('should wait for existing connection promise', async () => {
    // Simulate an in-progress connection
    // @ts-ignore - Accessing global object for testing
    global.mongoose = {
      conn: null,
      promise: new Promise(resolve => setTimeout(() => {
        // Cast mongoose to the expected type
        const result = { conn: mongoose, promise: null };
        resolve(result as any);
      }, 100))
    };
    
    // Start two connections at the same time
    const promise1 = dbConnect();
    const promise2 = dbConnect();
    
    // Both should resolve
    const [conn1, conn2] = await Promise.all([promise1, promise2]);
    
    // Mongoose connect should not be called
    expect(mongoose.connect).not.toHaveBeenCalled();
    
    // Both should return the same connection
    expect(conn1).toBe(conn2);
  });

  // Test error handling
  it('should propagate connection errors', async () => {
    // Mock mongoose.connect to throw an error
    (mongoose.connect as jest.Mock).mockImplementationOnce(() => {
      return Promise.reject(new Error('Connection failed'));
    });
    
    // Should throw an error
    await expect(dbConnect()).rejects.toThrow('Connection failed');
  });
});
