import { render, screen } from '@testing-library/react';
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
  it('renders the hero section', () => {
    render(<PortfolioPage />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Explore our photography collections')).toBeInTheDocument();
    expect(screen.getByAltText('MTP Collective Portfolio')).toBeInTheDocument();
  });

  it('renders the concert photography section', () => {
    render(<PortfolioPage />);
    expect(screen.getByText('Concert Photography')).toBeInTheDocument();
    expect(screen.getByText(/Capturing the energy and emotion of live performances/i)).toBeInTheDocument();
    expect(screen.getByText('Live Performance')).toBeInTheDocument();
    expect(screen.getByText('Stage Presence')).toBeInTheDocument();
    expect(screen.getByText('Crowd Energy')).toBeInTheDocument();
  });

  it('renders the automotive photography section', () => {
    render(<PortfolioPage />);
    expect(screen.getByText('Automotive Photography')).toBeInTheDocument();
    expect(screen.getByText(/Showcasing the beauty and power of automotive design/i)).toBeInTheDocument();
    expect(screen.getByText('Classic Beauty')).toBeInTheDocument();
    expect(screen.getByText('Modern Lines')).toBeInTheDocument();
    expect(screen.getByText('Speed and Grace')).toBeInTheDocument();
  });

  it('renders the nature photography section', () => {
    render(<PortfolioPage />);
    expect(screen.getByText('Nature Photography')).toBeInTheDocument();
    expect(screen.getByText(/Exploring the beauty and wonder of the natural world/i)).toBeInTheDocument();
    expect(screen.getByText('Mountain Majesty')).toBeInTheDocument();
    expect(screen.getByText('Forest Serenity')).toBeInTheDocument();
    expect(screen.getByText('Ocean Wonders')).toBeInTheDocument();
  });
}); 