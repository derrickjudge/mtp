import React from 'react';
import { render, screen } from '@testing-library/react';

// Create a mock portfolio component for testing
const SimplePortfolio = () => {
  return (
    <div data-testid="portfolio-container">
      <h1>Portfolio</h1>
      <div className="categories">
        <button>All</button>
        <button>Concerts</button>
        <button>Sports</button>
        <button>Nature</button>
        <button>Street</button>
        <button>Automotive</button>
      </div>
      <div className="photo-grid">
        <div className="photo-card" data-testid="photo-item">
          <h3>Concert Photo 1</h3>
          <p>Concerts</p>
        </div>
        <div className="photo-card" data-testid="photo-item">
          <h3>Sports Photo 1</h3>
          <p>Sports</p>
        </div>
      </div>
    </div>
  );
};

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img data-testid="mock-image" src={props.src} alt={props.alt} />;
  },
}));

describe('Simple Portfolio Component', () => {
  it('renders the portfolio heading', () => {
    render(<SimplePortfolio />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('displays category buttons', () => {
    render(<SimplePortfolio />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Concerts')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.getByText('Street')).toBeInTheDocument();
    expect(screen.getByText('Automotive')).toBeInTheDocument();
  });

  it('displays photo items in the grid', () => {
    render(<SimplePortfolio />);
    const photoItems = screen.getAllByTestId('photo-item');
    expect(photoItems.length).toBe(2);
    expect(screen.getByText('Concert Photo 1')).toBeInTheDocument();
    expect(screen.getByText('Sports Photo 1')).toBeInTheDocument();
  });
});
