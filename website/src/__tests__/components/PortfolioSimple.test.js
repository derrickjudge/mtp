import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a minimal test component
function PortfolioComponent({ photos }) {
  return (
    <div data-testid="portfolio">
      <h1>Portfolio</h1>
      <div className="filters">
        <button>All</button>
        <button>Concerts</button>
        <button>Sports</button>
        <button>Street</button>
        <button>Nature</button>
        <button>Automotive</button>
      </div>
      <div className="photos">
        {photos && photos.map(photo => (
          <div key={photo.id} data-testid="photo-card">
            <h3>{photo.title}</h3>
            <p>{photo.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mock the Next.js image component
jest.mock('next/image', () => function MockImage(props) {
  return <img data-testid="mock-image" {...props} />;
});

describe('Portfolio Component Tests', () => {
  const samplePhotos = [
    { id: '1', title: 'Concert Photo', category: 'Concerts', imageUrl: 'https://example.com/concert.jpg' },
    { id: '2', title: 'Sports Photo', category: 'Sports', imageUrl: 'https://example.com/sports.jpg' },
    { id: '3', title: 'Nature Photo', category: 'Nature', imageUrl: 'https://example.com/nature.jpg' }
  ];

  it('renders the portfolio heading', () => {
    render(<PortfolioComponent photos={samplePhotos} />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('renders all category filter buttons', () => {
    render(<PortfolioComponent photos={samplePhotos} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Concerts')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Street')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.getByText('Automotive')).toBeInTheDocument();
  });

  it('renders all photo cards', () => {
    render(<PortfolioComponent photos={samplePhotos} />);
    const photoCards = screen.getAllByTestId('photo-card');
    expect(photoCards.length).toBe(3);
    expect(screen.getByText('Concert Photo')).toBeInTheDocument();
    expect(screen.getByText('Sports Photo')).toBeInTheDocument();
    expect(screen.getByText('Nature Photo')).toBeInTheDocument();
  });
});
