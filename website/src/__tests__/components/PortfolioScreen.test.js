import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PortfolioScreen from '../../components/PortfolioScreen';

// Mock react-image-lightbox
jest.mock('react-image-lightbox', () => {
  return function MockLightbox(props) {
    return (
      <div data-testid="lightbox-mock">
        <button onClick={props.onCloseRequest} data-testid="close-button">
          Close
        </button>
        <button onClick={props.onMoveNextRequest} data-testid="next-button">
          Next
        </button>
        <div data-testid="lightbox-image">
          {props.mainSrc}
        </div>
      </div>
    );
  };
});

describe('PortfolioScreen Component', () => {
  const mockPhotos = [
    { 
      id: 'concert-1', 
      title: 'Concert Photo 1', 
      category: 'Concerts', 
      imageUrl: '/test-images/concert1.jpg',
      description: 'A beautiful concert photo'
    },
    { 
      id: 'sports-1', 
      title: 'Sports Photo 1', 
      category: 'Sports', 
      imageUrl: '/test-images/sports1.jpg',
      description: 'A beautiful sports photo'
    }
  ];

  it('renders the portfolio title', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('renders all photos by default', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    
    // Should show all photos initially
    expect(screen.getByText('Concert Photo 1')).toBeInTheDocument();
    expect(screen.getByText('Sports Photo 1')).toBeInTheDocument();
  });

  it('filters photos when a category is selected', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    
    // Click on the Concerts category
    fireEvent.click(screen.getByText('Concerts'));
    
    // Should show only concert photos
    expect(screen.getByText('Concert Photo 1')).toBeInTheDocument();
    expect(screen.queryByText('Sports Photo 1')).not.toBeInTheDocument();
  });

  it('opens the lightbox when a photo is clicked', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    
    // Lightbox should not be visible initially
    expect(screen.queryByTestId('lightbox-mock')).not.toBeInTheDocument();
    
    // Click on a photo
    fireEvent.click(screen.getByText('Concert Photo 1').closest('[data-testid="photo-card"]'));
    
    // Lightbox should now be visible
    expect(screen.getByTestId('lightbox-mock')).toBeInTheDocument();
  });

  it('closes the lightbox when close button is clicked', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    
    // Open the lightbox
    fireEvent.click(screen.getByText('Concert Photo 1').closest('[data-testid="photo-card"]'));
    expect(screen.getByTestId('lightbox-mock')).toBeInTheDocument();
    
    // Click the close button
    fireEvent.click(screen.getByTestId('close-button'));
    
    // Lightbox should be closed
    expect(screen.queryByTestId('lightbox-mock')).not.toBeInTheDocument();
  });
});
