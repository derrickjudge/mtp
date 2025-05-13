/**
 * Mock User Service
 * Provides mock user data for development and testing
 */

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface NewUser {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Sample mock users
const MOCK_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@mtpcollective.com',
    role: 'admin',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(), // 30 days ago
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString()  // 10 days ago
  },
  {
    id: 2,
    username: 'user',
    email: 'user@mtpcollective.com',
    role: 'user',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(), // 15 days ago
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString()   // 5 days ago
  },
  {
    id: 3,
    username: 'editor',
    email: 'editor@mtpcollective.com',
    role: 'user',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(), // 10 days ago
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString()   // 3 days ago
  }
];

// Keep track of the next available ID
let nextId = MOCK_USERS.length + 1;

/**
 * Get all users
 */
export async function getUsers(): Promise<ApiResponse<User[]>> {
  console.log('[MOCK-USERS] Fetching users');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    success: true,
    data: [...MOCK_USERS] // Return a copy to prevent inadvertent modifications
  };
}

/**
 * Get a user by ID
 */
export async function getUserById(id: number): Promise<ApiResponse<User>> {
  console.log(`[MOCK-USERS] Fetching user with ID: ${id}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const user = MOCK_USERS.find(u => u.id === id);
  
  if (!user) {
    return {
      success: false,
      error: 'User not found'
    };
  }
  
  return {
    success: true,
    data: { ...user }
  };
}

/**
 * Create a new user
 */
export async function createUser(newUser: NewUser): Promise<ApiResponse<User>> {
  console.log('[MOCK-USERS] Creating user:', newUser.username);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if username already exists
  if (MOCK_USERS.some(u => u.username === newUser.username)) {
    return {
      success: false,
      error: 'Username already exists'
    };
  }
  
  // Check if email already exists
  if (MOCK_USERS.some(u => u.email === newUser.email)) {
    return {
      success: false,
      error: 'Email already exists'
    };
  }
  
  const now = new Date().toISOString();
  const user: User = {
    id: nextId++,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    created_at: now,
    updated_at: now
  };
  
  // Add to mock database
  MOCK_USERS.push(user);
  
  return {
    success: true,
    data: { ...user }
  };
}

/**
 * Update a user
 */
export async function updateUser(id: number, userData: Partial<User>): Promise<ApiResponse<User>> {
  console.log(`[MOCK-USERS] Updating user with ID: ${id}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const userIndex = MOCK_USERS.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return {
      success: false,
      error: 'User not found'
    };
  }
  
  // Check if username already exists for a different user
  if (userData.username && 
      MOCK_USERS.some(u => u.username === userData.username && u.id !== id)) {
    return {
      success: false,
      error: 'Username already exists'
    };
  }
  
  // Check if email already exists for a different user
  if (userData.email && 
      MOCK_USERS.some(u => u.email === userData.email && u.id !== id)) {
    return {
      success: false,
      error: 'Email already exists'
    };
  }
  
  // Update the user
  const updatedUser = {
    ...MOCK_USERS[userIndex],
    ...userData,
    updated_at: new Date().toISOString()
  };
  
  MOCK_USERS[userIndex] = updatedUser;
  
  return {
    success: true,
    data: { ...updatedUser }
  };
}

/**
 * Delete a user
 */
export async function deleteUser(id: number): Promise<ApiResponse<null>> {
  console.log(`[MOCK-USERS] Deleting user with ID: ${id}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const userIndex = MOCK_USERS.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return {
      success: false,
      error: 'User not found'
    };
  }
  
  // Prevent deleting the main admin user
  if (MOCK_USERS[userIndex].role === 'admin' && id === 1) {
    return {
      success: false,
      error: 'Cannot delete the primary admin user'
    };
  }
  
  // Remove the user
  MOCK_USERS.splice(userIndex, 1);
  
  return {
    success: true,
    data: null
  };
}
