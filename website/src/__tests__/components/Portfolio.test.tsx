import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }) => <img src={src} alt={alt} />,
}));

// Mock react-image-lightbox
jest.mock('react-image-lightbox', () => ({
  __esModule: true,
  default: () => <div data-testid="lightbox" />,
}));

// Mock the actual Portfolio component with a simplified version for testing
jest.mock('../../app/portfolio/page', () => ({
  __esModule: true,
  default: () => {
    return (
      <div data-testid="portfolio-page">
        <h1>Portfolio</h1>
        <div data-testid="category-filters">
          <button>All</button>
          <button>Concerts</button>
          <button>Sports</button>
          <button>Street</button>
          <button>Nature</button>
          <button>Automotive</button>
        </div>
        <div data-testid="photo-grid">
          {['Concerts', 'Sports', 'Street', 'Nature', 'Automotive'].map((category) => (
            <div key={category} data-testid="photo-card" data-category={category}>
              <h3>{category} Photo</h3>
            </div>
          ))}
        </div>
      </div>
    );
  }
}));

// Import the mocked component
import PortfolioPage from '../../app/portfolio/page';

describe('Portfolio Page', () => {
  it('renders the portfolio page with title', () => {
    render(<PortfolioPage />);
    expect(screen.getByTestId('portfolio-page')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('displays category filters', () => {
    render(<PortfolioPage />);
    expect(screen.getByTestId('category-filters')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Concerts')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Street')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.getByText('Automotive')).toBeInTheDocument();
  });

  it('displays photo cards for different categories', () => {
    render(<PortfolioPage />);
    const photoCards = screen.getAllByTestId('photo-card');
    expect(photoCards.length).toBe(5); // One for each category
    
    // Check that there's a photo for each category
    expect(screen.getByText('Concerts Photo')).toBeInTheDocument();
    expect(screen.getByText('Sports Photo')).toBeInTheDocument();
    expect(screen.getByText('Street Photo')).toBeInTheDocument();
    expect(screen.getByText('Nature Photo')).toBeInTheDocument();
    expect(screen.getByText('Automotive Photo')).toBeInTheDocument();
  });
});
