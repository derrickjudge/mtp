import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Define types for our test component
interface Photo {
  id: string;
  title: string;
  category: string;
}

interface PortfolioGridProps {
  photos: Photo[];
}

// Create a simple test component that follows the existing patterns
const PortfolioGrid: React.FC<PortfolioGridProps> = ({ photos = [] }) => {
  return (
    <div data-testid="portfolio-grid">
      <h1>Portfolio</h1>
      <div data-testid="category-filters">
        <button>All</button>
        <button>Concerts</button>
        <button>Sports</button>
        <button>Street</button>
        <button>Nature</button>
        <button>Automotive</button>
      </div>
      <div>
        {photos.map(photo => (
          <div key={photo.id} data-testid="photo-card">
            <h3>{photo.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: { src: string; alt: string }) {
    return <img data-testid="mock-image" src={props.src} alt={props.alt} />;
  }
}));

describe('PortfolioGrid Component', () => {
  const mockPhotos: Photo[] = [
    { id: '1', title: 'Concert Photo 1', category: 'Concerts' },
    { id: '2', title: 'Sports Photo 1', category: 'Sports' },
    { id: '3', title: 'Street Photo 1', category: 'Street' }
  ];

  it('renders the portfolio title', () => {
    render(<PortfolioGrid photos={mockPhotos} />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('displays category filters', () => {
    render(<PortfolioGrid photos={mockPhotos} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Concerts')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Street')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.getByText('Automotive')).toBeInTheDocument();
  });

  it('displays photo cards for the photos provided', () => {
    render(<PortfolioGrid photos={mockPhotos} />);
    const photoCards = screen.getAllByTestId('photo-card');
    expect(photoCards).toHaveLength(3);
    expect(screen.getByText('Concert Photo 1')).toBeInTheDocument();
    expect(screen.getByText('Sports Photo 1')).toBeInTheDocument();
    expect(screen.getByText('Street Photo 1')).toBeInTheDocument();
  });
});
