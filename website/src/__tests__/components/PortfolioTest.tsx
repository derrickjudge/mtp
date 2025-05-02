import React from 'react';
import { render, screen } from '@testing-library/react';
import PortfolioScreen from '../../components/PortfolioScreen';

// Mock the next/image component
jest.mock('next/image', () => {
  return function MockImage() {
    return <div data-testid="mock-image">Image</div>;
  };
});

// Mock the react-image-lightbox component
jest.mock('react-image-lightbox', () => {
  return function MockLightbox() {
    return <div data-testid="mock-lightbox">Lightbox</div>;
  };
});

describe('Portfolio Screen', () => {
  // Create mock photos for testing
  const mockPhotos = [
    { 
      id: 'concert-1', 
      title: 'Concert Photo 1', 
      category: 'Concerts', 
      imageUrl: '/images/concert1.jpg',
      description: 'A concert photo',
      width: 800,
      height: 600
    },
    { 
      id: 'sports-1', 
      title: 'Sports Photo 1', 
      category: 'Sports', 
      imageUrl: '/images/sports1.jpg',
      description: 'A sports photo',
      width: 800,
      height: 600
    }
  ];

  it('should render the portfolio title', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('should display photo cards', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    
    // The photo titles should be rendered
    expect(screen.getByText('Concert Photo 1')).toBeInTheDocument();
    expect(screen.getByText('Sports Photo 1')).toBeInTheDocument();
    
    // Categories should be displayed
    expect(screen.getByText('Concerts')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
  });
});
