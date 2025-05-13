import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminUsers from '@/app/admin/users/page';

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/admin/users',
}));

describe('Admin Users Page', () => {
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

  beforeEach(() => {
    // Reset fetch mock before each test
    fetch.mockReset();
    
    // Mock successful users fetch by default
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers
    });
  });

  it('renders the users table with fetched data', async () => {
    render(<AdminUsers />);
    
    // Initially should show loading state
    expect(screen.getByText(/Loading users/i)).toBeInTheDocument();
    
    // Wait for users to load and table to appear
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
    
    // Check if user data is displayed in the table
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
  });

  it('opens the add user form when add user button is clicked', async () => {
    render(<AdminUsers />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
    
    // Click "Add User" button
    const addButton = screen.getByText('Add User');
    fireEvent.click(addButton);
    
    // Form should be visible
    expect(screen.getByText('Add New User')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
  });

  it('can add a new user successfully', async () => {
    // Mock API response for user creation
    fetch.mockReset();
    // First call - get users
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers
    });
    // Second call - create user
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: 'User created successfully', userId: 3 })
    });
    // Third call - refresh user list after creation
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [...mockUsers, {
        id: 3,
        username: 'newuser',
        email: 'newuser@example.com',
        role: 'user',
        created_at: '2025-01-03T00:00:00.000Z',
        updated_at: '2025-01-03T00:00:00.000Z'
      }]
    });
    
    render(<AdminUsers />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
    
    // Click "Add User" button
    const addButton = screen.getByText('Add User');
    fireEvent.click(addButton);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), { 
      target: { value: 'newuser' } 
    });
    fireEvent.change(screen.getByLabelText('Email'), { 
      target: { value: 'newuser@example.com' } 
    });
    fireEvent.change(screen.getByLabelText('Password'), { 
      target: { value: 'password123' } 
    });
    
    // Select "user" role
    const roleSelect = screen.getByLabelText('Role');
    fireEvent.change(roleSelect, { target: { value: 'user' } });
    
    // Submit the form
    const submitButton = screen.getByText('Create User');
    fireEvent.click(submitButton);
    
    // Check success message
    await waitFor(() => {
      expect(screen.getByText('User created successfully')).toBeInTheDocument();
    });
    
    // Verify API call
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[1][0]).toBe('/api/users');
    expect(fetch.mock.calls[1][1].method).toBe('POST');
    
    const requestBody = JSON.parse(fetch.mock.calls[1][1].body);
    expect(requestBody.username).toBe('newuser');
    expect(requestBody.email).toBe('newuser@example.com');
    expect(requestBody.password).toBe('password123');
    expect(requestBody.role).toBe('user');
  });

  it('handles API errors when fetching users', async () => {
    // Override the default mock to simulate an error
    fetch.mockReset();
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' })
    });
    
    render(<AdminUsers />);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Error loading users/i)).toBeInTheDocument();
    });
  });

  it('displays error when adding user fails', async () => {
    // Mock API responses
    fetch.mockReset();
    // First call - get users
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers
    });
    // Second call - create user (fails)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Username already exists' })
    });
    
    render(<AdminUsers />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
    
    // Open add user form
    fireEvent.click(screen.getByText('Add User'));
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), { 
      target: { value: 'admin' } // Using existing username to trigger error
    });
    fireEvent.change(screen.getByLabelText('Email'), { 
      target: { value: 'new@example.com' } 
    });
    fireEvent.change(screen.getByLabelText('Password'), { 
      target: { value: 'password123' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create User'));
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });
  });
});
