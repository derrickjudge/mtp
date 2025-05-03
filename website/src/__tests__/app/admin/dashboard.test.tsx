import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '../../../app/admin/dashboard/page';

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch API
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

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
    (global.fetch as jest.Mock)
      .mockImplementation((url) => {
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
  
  it('should show authentication error and redirect when no token is present', async () => {
    // Ensure localStorage has no token
    localStorageMock.clear();
    
    const { getByText } = render(<AdminDashboard />);
    
    // Check that the authentication status shows error
    await waitFor(() => {
      expect(screen.getByText(/no authentication token found/i)).toBeInTheDocument();
    });
    
    // Wait for redirect timer to trigger
    await waitFor(() => {
      // Verify router.push was called with login path
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/login');
    }, { timeout: 3000 });
  });
  
  it('should load dashboard stats successfully', async () => {
    // Set mock token in localStorage
    localStorageMock.setItem('auth_token', 'mock-token');
    
    render(<AdminDashboard />);
    
    // Wait for the stats to load
    await waitFor(() => {
      // Check photos count stat (25 from mock response)
      expect(screen.getByText('25')).toBeInTheDocument();
      // Check categories count (3 from mock response)
      expect(screen.getByText('3')).toBeInTheDocument();
    });
    
    // Verify dashboard cards are rendered
    expect(screen.getByText(/manage photos/i)).toBeInTheDocument();
    expect(screen.getByText(/manage categories/i)).toBeInTheDocument();
    expect(screen.getByText(/upload photos/i)).toBeInTheDocument();
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API failure
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    
    // Set mock token in localStorage
    localStorageMock.setItem('auth_token', 'mock-token');
    
    render(<AdminDashboard />);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard data/i)).toBeInTheDocument();
    });
  });
});
