import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PortfolioScreen from '../../components/PortfolioScreen';

// Mock next/image since it requires configuration for external domains in tests
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img 
      src={props.src} 
      alt={props.alt}
      data-testid="mock-image"
      className={props.className}
    />;
  },
}));

// Mock react-image-lightbox
jest.mock('react-image-lightbox', () => ({
  __esModule: true,
  default: (props: any) => {
    return (
      <div data-testid="lightbox-mock">
        <button onClick={props.onCloseRequest} data-testid="lightbox-close">Close</button>
        <button onClick={props.onMoveNextRequest} data-testid="lightbox-next">Next</button>
        <button onClick={props.onMovePrevRequest} data-testid="lightbox-prev">Previous</button>
        <div data-testid="lightbox-image">{props.mainSrc}</div>
      </div>
    );
  },
}));

describe('PortfolioScreen Component', () => {
  const mockPhotos = [
    { 
      id: 'concert-1',
      title: 'Concert Photo 1',
      description: 'A beautiful concert photo',
      category: 'Concerts',
      imageUrl: 'https://example.com/concert1.jpg',
      width: 800,
      height: 600
    },
    { 
      id: 'sports-1',
      title: 'Sports Photo 1',
      description: 'A beautiful sports photo',
      category: 'Sports',
      imageUrl: 'https://example.com/sports1.jpg',
      width: 800,
      height: 600
    },
    { 
      id: 'nature-1',
      title: 'Nature Photo 1',
      description: 'A beautiful nature photo',
      category: 'Nature',
      imageUrl: 'https://example.com/nature1.jpg',
      width: 800,
      height: 600
    }
  ];

  it('renders the portfolio title', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('renders category filter buttons', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Concerts')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.getByText('Automotive')).toBeInTheDocument();
  });

  it('renders photo cards for the provided photos', () => {
    render(<PortfolioScreen photos={mockPhotos} />);
    expect(screen.getByText('Concert Photo 1')).toBeInTheDocument();
    expect(screen.getByText('Sports Photo 1')).toBeInTheDocument();
    expect(screen.getByText('Nature Photo 1')).toBeInTheDocument();
  });
});
