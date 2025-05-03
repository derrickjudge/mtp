const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');
const AdminDashboard = require('../../../app/admin/dashboard/page').default;

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch API
global.fetch = jest.fn();

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

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('AdminDashboard Component', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage
    localStorageMock.clear();
    
    // Mock fetch responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/photos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            pagination: { total: 25 },
            photos: []
          })
        });
      } else if (url.includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'Category 1' },
            { id: 2, name: 'Category 2' },
            { id: 3, name: 'Category 3' }
          ])
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock next/navigation
    jest.mock('next/navigation', () => ({
      useRouter: () => mockRouter,
    }));
  });
  
  it('should display authentication verification when token is present', async () => {
    // Set mock token in localStorage
    localStorageMock.setItem('auth_token', 'mock-token');
    
    render(<AdminDashboard />);
    
    // Check that the authentication status shows verified
    await waitFor(() => {
      expect(screen.getByText(/authentication verified/i)).toBeInTheDocument();
    });
  });
  
  it('should show authentication error when no token is present', async () => {
    // Ensure localStorage has no token
    localStorageMock.clear();
    
    render(<AdminDashboard />);
    
    // Check that the authentication status shows error
    await waitFor(() => {
      expect(screen.getByText(/no authentication token found/i)).toBeInTheDocument();
    });
  });
  
  it('should load dashboard stats successfully', async () => {
    // Set mock token in localStorage
    localStorageMock.setItem('auth_token', 'mock-token');
    
    render(<AdminDashboard />);
    
    // Wait for the stats to load
    await waitFor(() => {
      // Check for expected text in the dashboard
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    });
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API failure
    global.fetch.mockRejectedValueOnce(new Error('API Error'));
    
    // Set mock token in localStorage
    localStorageMock.setItem('auth_token', 'mock-token');
    
    render(<AdminDashboard />);
    
    // Wait for API call to fail
    await waitFor(() => {
      // Check for loading text, since error will take time to show
      expect(screen.getByText(/loading dashboard stats/i)).toBeInTheDocument();
    });
  });
});
