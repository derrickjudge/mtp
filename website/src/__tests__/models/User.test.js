/**
 * User Model Tests - JavaScript version for Jest compatibility
 */

const mongoose = require('mongoose');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('User Model Test', () => {
  // Set up MongoDB memory server for tests
  beforeAll(async () => {
    // Using the in-memory MongoDB for tests
    // This assumes the test setup in jest.setup.js handles the MongoDB connection
  });

  // Clean up after tests
  afterAll(async () => {
    // Clean up connections
    await mongoose.connection.close();
  });

  // Test creating a user
  it('should create & save a user successfully', async () => {
    const userData = {
      username: 'testuser',
      password: 'Password123!',
      role: 'admin'
    };
    
    const validUser = new User(userData);
    const savedUser = await validUser.save();
    
    // Object Id should be defined when successfully saved to MongoDB
    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.role).toBe(userData.role);
    
    // Password should be hashed, not stored in plain text
    expect(savedUser.password).not.toBe(userData.password);
    // Verify it's a bcrypt hash
    expect(savedUser.password.startsWith('$2')).toBeTruthy();
  });

  // Test validation is working
  it('should fail to save a user with missing required fields', async () => {
    const invalidUser = new User({
      username: 'incompleteuser' // Missing password
    });
    
    let error;
    try {
      await invalidUser.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(error.errors.password).toBeDefined();
  });

  // Test uniqueness constraint of username
  it('should fail to save a user with duplicate username', async () => {
    // Create first user
    const firstUser = new User({
      username: 'uniqueuser',
      password: 'Password123!',
      role: 'user'
    });
    await firstUser.save();
    
    // Try to create another user with the same username
    const duplicateUser = new User({
      username: 'uniqueuser', // Same username as the first user
      password: 'DifferentPassword456!',
      role: 'user'
    });
    
    let error;
    try {
      await duplicateUser.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeDefined();
    // The error should be a duplicate key error
    expect(error.code).toBe(11000); // MongoDB duplicate key error code
  });

  // Test password comparison method
  it('should correctly compare passwords', async () => {
    const password = 'SecurePassword789!';
    
    // Create a user with the password
    const user = new User({
      username: 'passworduser',
      password,
      role: 'user'
    });
    await user.save();
    
    // Retrieve the user
    const savedUser = await User.findOne({ username: 'passworduser' });
    
    // Test correct password
    const validPassword = await savedUser.comparePassword(password);
    expect(validPassword).toBeTruthy();
    
    // Test incorrect password
    const invalidPassword = await savedUser.comparePassword('WrongPassword');
    expect(invalidPassword).toBeFalsy();
  });

  // Test role validation
  it('should only allow valid roles', async () => {
    const invalidUser = new User({
      username: 'roleuser',
      password: 'Password123!',
      role: 'invalidrole' // Not in the enum
    });
    
    let error;
    try {
      await invalidUser.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(error.errors.role).toBeDefined();
  });

  // Test default role
  it('should set default role to "user" if not provided', async () => {
    const user = new User({
      username: 'defaultroleuser',
      password: 'Password123!'
      // role not provided, should default to 'user'
    });
    
    const savedUser = await user.save();
    
    expect(savedUser.role).toBe('user');
  });

  // Test password update
  it('should hash password when updated', async () => {
    // Create a user
    const user = new User({
      username: 'updateuser',
      password: 'InitialPassword123!',
      role: 'user'
    });
    const savedUser = await user.save();
    const originalPassword = savedUser.password;
    
    // Update password
    savedUser.password = 'NewPassword456!';
    await savedUser.save();
    
    // Verify password was hashed
    expect(savedUser.password).not.toBe('NewPassword456!');
    expect(savedUser.password).not.toBe(originalPassword);
    expect(savedUser.password.startsWith('$2')).toBeTruthy();
    
    // Verify new password works with comparePassword
    const validPassword = await savedUser.comparePassword('NewPassword456!');
    expect(validPassword).toBeTruthy();
  });

  // Test not rehashing unchanged password
  it('should not rehash password if unchanged', async () => {
    // Create a user
    const user = new User({
      username: 'norehasher',
      password: 'Password123!',
      role: 'user'
    });
    const savedUser = await user.save();
    const originalPassword = savedUser.password;
    
    // Update username but not password
    savedUser.username = 'norehasherupdated';
    await savedUser.save();
    
    // Verify password was not rehashed
    expect(savedUser.password).toBe(originalPassword);
  });
});
