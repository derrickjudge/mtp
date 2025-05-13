const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');
const AdminLogin = require('../../../app/admin/login/page').default;

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: jest.fn((key) => localStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  }),
};

// Mock sessionStorage
const sessionStorageMock = {
  store: {},
  getItem: jest.fn((key) => sessionStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => {
    sessionStorageMock.store[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete sessionStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    sessionStorageMock.store = {};
  }),
};

// Add mocks to window
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock the fetch API
global.fetch = jest.fn();

describe('AdminLogin Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset localStorage and sessionStorage
    localStorageMock.clear();
    sessionStorageMock.clear();
    
    // Mock window methods
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        href: '',
        origin: 'http://localhost:3000',
        pathname: '/admin/login'
      }
    });
    
    // Mock the console methods to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset fetch mock
    global.fetch.mockReset();
  });

  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });

  it('renders the login form correctly', () => {
    render(<AdminLogin />);
    
    // Check for the form elements
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows validation errors when form is submitted with empty fields', async () => {
    render(<AdminLogin />);
    
    // Submit the form without filling in any fields
    const submitButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitButton);
    
    // Check for validation errors
    // Note: This depends on HTML5 validation
    // If the form uses custom validation, adjust these assertions accordingly
    const usernameInput = screen.getByLabelText(/username/i);
    expect(usernameInput.validity.valid).toBe(false);
  });

  it('handles successful login and stores token in localStorage', async () => {
    // Mock successful login response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: { id: 1, username: 'admin', role: 'admin' },
        token: 'mock-jwt-token'
      })
    });
    
    render(<AdminLogin />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), { 
      target: { value: 'admin' } 
    });
    fireEvent.change(screen.getByLabelText(/password/i), { 
      target: { value: 'admin123' } 
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitButton);
    
    // Wait for the login process to complete
    await waitFor(() => {
      // Check that token was stored in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'mock-jwt-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify({ 
        id: 1, 
        username: 'admin', 
        role: 'admin'
      }));
      
      // Check that session storage also received the token for redundancy
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('authToken', 'mock-jwt-token');
      
      // Verify login success message appears
      expect(screen.getByText(/login successful/i)).toBeInTheDocument();
    });
  });

  it('displays error message on login failure', async () => {
    // Mock failed login response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        message: 'Invalid credentials'
      })
    });
    
    render(<AdminLogin />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), { 
      target: { value: 'admin' } 
    });
    fireEvent.change(screen.getByLabelText(/password/i), { 
      target: { value: 'wrong-password' } 
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitButton);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
    
    // Check that localStorage was not updated
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('handles network errors gracefully', async () => {
    // Mock network error
    global.fetch.mockRejectedValueOnce(
      new Error('Network error')
    );
    
    render(<AdminLogin />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), { 
      target: { value: 'admin' } 
    });
    fireEvent.change(screen.getByLabelText(/password/i), { 
      target: { value: 'admin123' } 
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitButton);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
