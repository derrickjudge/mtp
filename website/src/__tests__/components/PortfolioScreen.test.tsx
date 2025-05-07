import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component we're going to create for testing
import PortfolioScreen from '../../components/PortfolioScreen';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt?: string; width?: number; height?: number; [key: string]: any }) => {
    return (
      <img 
        src={props.src} 
        alt={props.alt}
        data-testid="mock-image"
        className={props.className}
      />
    );
  },
}));

// Mock yet-another-react-lightbox
jest.mock('yet-another-react-lightbox', () => ({
  __esModule: true,
  default: (props: { onCloseRequest?: () => void; onMoveNextRequest?: () => void; onMovePrevRequest?: () => void; mainSrc?: string; [key: string]: any }) => {
    return (
      <div data-testid="lightbox-mock">
        <button onClick={props.onCloseRequest} data-testid="close-button">Close</button>
        <button onClick={props.onMoveNextRequest} data-testid="next-button">Next</button>
        <button onClick={props.onMovePrevRequest} data-testid="prev-button">Previous</button>
      </div>
    );
  },
}));

describe('PortfolioScreen Component', () => {
  const mockPhotos = [
    { id: '1', title: 'Concert Photo 1', category: 'Concerts', imageUrl: 'https://example.com/1.jpg' },
    { id: '2', title: 'Sports Photo 1', category: 'Sports', imageUrl: 'https://example.com/2.jpg' },
    { id: '3', title: 'Street Photo 1', category: 'Street', imageUrl: 'https://example.com/3.jpg' },
    { id: '4', title: 'Nature Photo 1', category: 'Nature', imageUrl: 'https://example.com/4.jpg' },
    { id: '5', title: 'Automotive Photo 1', category: 'Automotive', imageUrl: 'https://example.com/5.jpg' },
  ];

  it('renders the portfolio screen with title', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('displays all category filter buttons', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    
    // Check for all category buttons
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Concerts')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Street')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.getByText('Automotive')).toBeInTheDocument();
  });

  it('shows all photos when "All" category is selected', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    
    // Click the All button to ensure all photos are shown
    fireEvent.click(screen.getByText('All'));
    
    // Check that all photo titles are in the document
    expect(screen.getByText('Concert Photo 1')).toBeInTheDocument();
    expect(screen.getByText('Sports Photo 1')).toBeInTheDocument();
    expect(screen.getByText('Street Photo 1')).toBeInTheDocument();
    expect(screen.getByText('Nature Photo 1')).toBeInTheDocument();
    expect(screen.getByText('Automotive Photo 1')).toBeInTheDocument();
  });

  it('filters photos when a specific category is selected', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    
    // Click on a specific category
    fireEvent.click(screen.getByText('Concerts'));
    
    // Check that only photos from that category are visible
    expect(screen.getByText('Concert Photo 1')).toBeInTheDocument();
    
    // Other categories should not be visible
    expect(screen.queryByText('Sports Photo 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Street Photo 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Nature Photo 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Automotive Photo 1')).not.toBeInTheDocument();
  });

  it('opens lightbox when a photo is clicked', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    
    // Initially, lightbox should not be visible
    expect(screen.queryByTestId('lightbox-mock')).not.toBeInTheDocument();
    
    // Click on a photo to open the lightbox
    fireEvent.click(screen.getByText('Concert Photo 1'));
    
    // Lightbox should now be visible
    expect(screen.getByTestId('lightbox-mock')).toBeInTheDocument();
  });

  it('closes lightbox when close button is clicked', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    
    // Open the lightbox
    fireEvent.click(screen.getByText('Concert Photo 1'));
    expect(screen.getByTestId('lightbox-mock')).toBeInTheDocument();
    
    // Click the close button
    fireEvent.click(screen.getByTestId('close-button'));
    
    // Lightbox should be closed
    expect(screen.queryByTestId('lightbox-mock')).not.toBeInTheDocument();
  });
});
