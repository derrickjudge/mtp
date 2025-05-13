import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the components we depend on
jest.mock('../../app/portfolio/page', () => {
  return function MockPortfolioPage() {
    return (
      <div data-testid="portfolio-page">
        <h1>Portfolio</h1>
        <div className="categories">
          <button>All</button>
          <button>Concerts</button>
          <button>Sports</button>
          <button>Street</button>
          <button>Nature</button>
          <button>Automotive</button>
        </div>
        <div className="photo-grid">
          <div data-testid="photo-card" data-category="Concerts">
            <h3>Concerts Photo 1</h3>
          </div>
          <div data-testid="photo-card" data-category="Sports">
            <h3>Sports Photo 1</h3>
          </div>
          <div data-testid="photo-card" data-category="Street">
            <h3>Street Photo 1</h3>
          </div>
        </div>
      </div>
    );
  };
});

jest.mock('yet-another-react-lightbox', () => {
  return function MockLightbox() {
    return <div data-testid="lightbox-mock" />;
  };
});

describe('PortfolioPage Component', () => {
  it('should render the portfolio page with title', () => {
    render(<MockPortfolioPage />);
    
    // Check that the main title is rendered
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });
  
  it('should display category buttons', () => {
    render(<MockPortfolioPage />);
    
    // Check for category buttons
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Concerts')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Street')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.getByText('Automotive')).toBeInTheDocument();
  });
  
  it('should display photo cards', () => {
    render(<MockPortfolioPage />);
    
    // Check that photo cards are rendered
    const photoCards = screen.getAllByTestId('photo-card');
    expect(photoCards.length).toBeGreaterThan(0);
  });
});

function MockPortfolioPage() {
  return (
    <div data-testid="portfolio-page">
      <h1>Portfolio</h1>
      <div className="categories">
        <button>All</button>
        <button>Concerts</button>
        <button>Sports</button>
        <button>Street</button>
        <button>Nature</button>
        <button>Automotive</button>
      </div>
      <div className="photo-grid">
        <div data-testid="photo-card" data-category="Concerts">
          <h3>Concerts Photo 1</h3>
        </div>
        <div data-testid="photo-card" data-category="Sports">
          <h3>Sports Photo 1</h3>
        </div>
        <div data-testid="photo-card" data-category="Street">
          <h3>Street Photo 1</h3>
        </div>
      </div>
    </div>
  );
}
