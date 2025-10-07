import { render, screen, waitFor } from '@testing-library/react';
import PortfolioPage from '@/app/portfolio/page';

// Mock the Image component
jest.mock('@/components/common/Image', () => ({
  Image: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

// Mock GalleryGrid component
jest.mock('@/components/common/GalleryGrid', () => ({
  GalleryGrid: ({ photos }: { photos: any[] }) => (
    <div data-testid="gallery-grid">
      {photos.map((photo, i) => (
        <div key={i} data-testid="gallery-item">
          {photo.title}
        </div>
      ))}
    </div>
  ),
}));

describe('PortfolioPage', () => {
  beforeEach(() => {
    // Mock fetch for categories and photos
    jest.spyOn(global, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/categories')) {
        return {
          ok: true,
          json: async () => [],
        } as any;
      }
      if (url.includes('/api/photos')) {
        return {
          ok: true,
          json: async () => ({ photos: [] }),
        } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockRestore();
  });

  it('renders the hero and loading states, then empty state', async () => {
    render(<PortfolioPage />);

    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(
      screen.getByText(/Explore our photography collections/i)
    ).toBeInTheDocument();

    // Loading indicator first
    expect(screen.getByText('Loading photos...')).toBeInTheDocument();

    // Then empty state once fetch resolves
    await waitFor(() => {
      expect(screen.getByText(/No Photos Available/i)).toBeInTheDocument();
    });
  });
});