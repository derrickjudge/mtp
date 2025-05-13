// Mock required modules and functions
const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');

// Try/catch for importing the component, in case it has syntax not supported by Jest
let AdminSettings;
try {
  AdminSettings = require('../../../app/admin/settings/page').default;
} catch (e) {
  // If we can't import the component, create a mock
  AdminSettings = () => {
    return React.createElement('div', null, 'Settings Page Mock');
  };
  console.warn('Could not import AdminSettings component, using mock');
}

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/admin/settings',
}));

describe('Admin Settings Page', () => {
  // Test data - settings object
  const mockSettings = {
    siteName: 'MTP Collective',
    siteDescription: 'Photography portfolio website',
    contactEmail: 'test@example.com',
    logoUrl: 'https://example.com/logo.png',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    socialMedia: {
      instagram: '@mtpcollective',
      twitter: '@mtpcollective',
      facebook: 'mtpcollective'
    },
    metaTags: {
      title: 'MTP Collective',
      description: 'Photography portfolio website',
      keywords: 'photography, portfolio, art'
    }
  };

  beforeEach(() => {
    // Reset fetch mock before each test
    fetch.mockReset();
    
    // Mock successful settings fetch by default
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings
    });
  });

  it('renders the settings form with fetched data', async () => {
    render(<AdminSettings />);
    
    // Initially should show loading state
    expect(screen.getByText(/Loading settings/i)).toBeInTheDocument();
    
    // Wait for settings to load and form to appear
    await waitFor(() => {
      expect(screen.getByText('Site Settings')).toBeInTheDocument();
    });
    
    // Check if form fields are populated with fetched data
    expect(screen.getByLabelText(/Site Name/i)).toHaveValue('MTP Collective');
    expect(screen.getByLabelText(/Contact Email/i)).toHaveValue('test@example.com');
  });

  it('handles API errors gracefully', async () => {
    // Override the default mock to simulate an error
    fetch.mockReset();
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });
    
    render(<AdminSettings />);
    
    // Should render the settings form with default values
    await waitFor(() => {
      expect(screen.getByText('Site Settings')).toBeInTheDocument();
    });
    
    // Default values should still be used
    expect(screen.getByLabelText(/Site Name/i)).toHaveValue('MTP Collective');
  });

  it('can update settings and submit the form', async () => {
    // Setup mocks for both GET and PUT
    fetch.mockReset();
    // Mock the initial GET request
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        siteName: 'MTP Collective',
        siteDescription: 'Photography portfolio website',
        primaryColor: '#000000',
        secondaryColor: '#ffffff'
      })
    });
    
    // Mock the PUT request for saving settings
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Settings updated successfully' })
    });
    
    render(<AdminSettings />);
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByText('Site Settings')).toBeInTheDocument();
    });
    
    // Change a setting
    const siteNameInput = screen.getByLabelText(/Site Name/i);
    fireEvent.change(siteNameInput, { target: { value: 'Updated MTP Collective' } });
    expect(siteNameInput).toHaveValue('Updated MTP Collective');
    
    // Submit the form
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Settings saved successfully/i)).toBeInTheDocument();
    });
    
    // Verify that fetch was called with the correct arguments
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][0]).toBe('/api/settings');
    expect(fetch.mock.calls[1][1].method).toBe('PUT');
    const requestBody = JSON.parse(fetch.mock.calls[1][1].body);
    expect(requestBody.siteName).toBe('Updated MTP Collective');
  });

  it('displays error message when settings update fails', async () => {
    // Setup mocks for both GET and failed PUT
    fetch.mockReset();
    // Mock the initial GET request
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        siteName: 'MTP Collective',
        siteDescription: 'Photography portfolio website'
      })
    });
    
    // Mock the PUT request to fail
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Failed to save settings' })
    });
    
    render(<AdminSettings />);
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByText('Site Settings')).toBeInTheDocument();
    });
    
    // Submit the form
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to save settings/i)).toBeInTheDocument();
    });
  });
});
