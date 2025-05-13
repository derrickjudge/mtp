const authService = require('../../services/authService').default;
const db = require('../../lib/database');
const bcrypt = require('bcryptjs');
const auth = require('../../lib/auth');

// Mock the database module
jest.mock('../../lib/database', () => ({
  query: jest.fn(),
}));

// Mock bcrypt for password comparison
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

// Mock the auth module
jest.mock('../../lib/auth', () => ({
  generateToken: jest.fn().mockReturnValue('mock_token'),
}));

describe('Auth Service Tests', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateUser', () => {
    it('should return null if user is not found', async () => {
      // Mock empty user query result
      db.query.mockResolvedValueOnce([]);

      const result = await authService.authenticateUser('unknown_user', 'password');
      
      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
        ['unknown_user', 'unknown_user']
      );
    });

    it('should return null if password does not match', async () => {
      // Mock user query result
      db.query.mockResolvedValueOnce([{
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        password: 'hashed_password',
        role: 'admin',
      }]);
      
      // Mock failed password comparison
      bcrypt.compare.mockResolvedValueOnce(false);

      const result = await authService.authenticateUser('admin', 'wrong_password');
      
      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong_password', 'hashed_password');
    });

    it('should return user data and token on successful authentication', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        password: 'hashed_password',
        role: 'admin',
      };
      
      // Mock user query result
      db.query.mockResolvedValueOnce([mockUser]);
      
      // Mock successful password comparison
      bcrypt.compare.mockResolvedValueOnce(true);

      const result = await authService.authenticateUser('admin', 'correct_password');
      
      expect(result).not.toBeNull();
      expect(result.token).toBe('mock_token');
      expect(result.user).toEqual({
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
      });
      expect(auth.generateToken).toHaveBeenCalledWith({
        userId: 1,
        username: 'admin',
        role: 'admin',
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      db.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Mock console.error to prevent error logs during test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await authService.authenticateUser('admin', 'password');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });

  describe('getUserById', () => {
    it('should return null if user is not found', async () => {
      // Mock empty user query result
      db.query.mockResolvedValueOnce([]);

      const result = await authService.getUserById(999);
      
      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
        [999]
      );
    });

    it('should return user data without password if found', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        created_at: '2025-01-01',
        updated_at: '2025-01-02',
      };
      
      // Mock user query result
      db.query.mockResolvedValueOnce([mockUser]);

      const result = await authService.getUserById(1);
      
      expect(result).toEqual(mockUser);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      db.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Mock console.error to prevent error logs during test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getUserById(1);
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });

  describe('updatePassword', () => {
    it('should return failure if user is not found', async () => {
      // Mock empty user query result
      db.query.mockResolvedValueOnce([]);

      const result = await authService.updatePassword(999, 'current_password', 'new_password');
      
      expect(result).toEqual({ 
        success: false, 
        message: 'User not found' 
      });
    });

    it('should return failure if current password is incorrect', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        password: 'hashed_password',
      };
      
      // Mock user query result
      db.query.mockResolvedValueOnce([mockUser]);
      
      // Mock failed password comparison
      bcrypt.compare.mockResolvedValueOnce(false);

      const result = await authService.updatePassword(1, 'wrong_password', 'new_password');
      
      expect(result).toEqual({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    });

    it('should update password successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        password: 'hashed_password',
      };
      
      // Mock user query result
      db.query.mockResolvedValueOnce([mockUser]);
      
      // Mock successful password comparison
      bcrypt.compare.mockResolvedValueOnce(true);
      
      // Mock update query
      db.query.mockResolvedValueOnce({ affectedRows: 1 });

      const result = await authService.updatePassword(1, 'current_password', 'new_password');
      
      expect(result).toEqual({ 
        success: true, 
        message: 'Password updated successfully' 
      });
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('new_password', 'salt');
      expect(db.query).toHaveBeenLastCalledWith(
        'UPDATE users SET password = ? WHERE id = ?',
        ['hashed_password', 1]
      );
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      db.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Mock console.error to prevent error logs during test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await authService.updatePassword(1, 'current_password', 'new_password');
      
      expect(result).toEqual({ 
        success: false,
        message: 'Server error updating password' 
      });
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });
});
