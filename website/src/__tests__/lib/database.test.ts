/**
 * Tests for database utility functions
 */

import db, { query, transaction, checkDatabaseConnection } from '@/lib/database';

// Import mocked items - TypeScript needs type assertion here
const { mockCalls, mockConnection, __resetMockCalls } = jest.requireMock('mysql2/promise') as any;

describe('Database Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    __resetMockCalls();
  });

  describe('query function', () => {
    it('should execute a query and return results', async () => {
      const sql = 'SELECT * FROM categories';
      const params = [];
      
      const result = await query(sql, params);
      
      // Verify the query was called with correct parameters
      expect(mockCalls.query.length).toBe(1);
      expect(mockCalls.query[0].sql).toBe(sql);
      expect(mockCalls.query[0].params).toBe(params);
      
      // Verify connection was released
      expect(mockCalls.release.length).toBe(1);
      
      // Should return the mock categories
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
    
    it('should handle query parameters correctly', async () => {
      const sql = 'SELECT * FROM photos WHERE id = ?';
      const params = [1];
      
      await query(sql, params);
      
      // Verify parameters were passed correctly
      expect(mockCalls.query[0].params).toEqual(params);
    });
    
    it('should release connection even when query fails', async () => {
      // Make the query fail
      mockConnection.query.mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      await expect(query('SELECT * FROM invalid_table')).rejects.toThrow();
      
      // Verify connection was still released
      expect(mockCalls.release.length).toBe(1);
    });
  });
  
  describe('transaction function', () => {
    it('should execute callback function within a transaction', async () => {
      const mockCallback = jest.fn(async (conn) => {
        await conn.query('SELECT * FROM categories');
        await conn.query('INSERT INTO categories (name) VALUES (?)', ['New Category']);
        return { success: true };
      });
      
      const result = await transaction(mockCallback);
      
      // Verify transaction lifecycle
      expect(mockCalls.beginTransaction.length).toBe(1);
      expect(mockCalls.query.length).toBe(2);
      expect(mockCalls.commit.length).toBe(1);
      expect(mockCalls.release.length).toBe(1);
      
      // Verify callback was executed
      expect(mockCallback).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
    
    it('should rollback transaction when an error occurs', async () => {
      const mockCallback = jest.fn(async (conn) => {
        throw new Error('Transaction failed');
      });
      
      await expect(transaction(mockCallback)).rejects.toThrow('Transaction failed');
      
      // Verify transaction was rolled back
      expect(mockCalls.beginTransaction.length).toBe(1);
      expect(mockCalls.rollback.length).toBe(1);
      expect(mockCalls.commit.length).toBe(0);
      expect(mockCalls.release.length).toBe(1);
    });
  });
  
  describe('checkDatabaseConnection function', () => {
    it('should return true when database is accessible', async () => {
      const result = await checkDatabaseConnection();
      
      expect(result).toBe(true);
      expect(mockCalls.query.length).toBe(1);
      expect(mockCalls.query[0].sql).toBe('SELECT 1');
    });
    
    it('should return false when database connection fails', async () => {
      // Make the connection check fail
      mockConnection.query.mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });
      
      const result = await checkDatabaseConnection();
      
      expect(result).toBe(false);
    });
  });
});
