import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PortfolioPage from '../../app/portfolio/page';
import '@testing-library/jest-dom';

// Ignore TypeScript errors in the test mocks
// @ts-ignore
jest.mock('react-image-lightbox', () => {
  return function DummyLightbox(props: any) {
    return (
      <div data-testid="lightbox-mock">
        <div>Current: {props.mainSrc}</div>
        <div>Title: {props.imageTitle}</div>
        <button onClick={props.onCloseRequest}>Close</button>
        <button onClick={props.onMoveNextRequest}>Next</button>
        <button onClick={props.onMovePrevRequest}>Previous</button>
      </div>
    );
  };
});

// @ts-ignore
jest.mock('next/image', () => {
  return function DummyImage(props: any) {
    return (
      <img 
        src={props.src} 
        alt={props.alt} 
        data-testid="next-image"
      />
    );
  };
});

describe('PortfolioPage Component', () => {
  it('should render the portfolio page with title', () => {
    render(<PortfolioPage />);
    
    // Check that the main title is rendered
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });
  
  it('should render category filters', () => {
    render(<PortfolioPage />);
    
    // Check that all category filters are rendered
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Concerts')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Street')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.getByText('Automotive')).toBeInTheDocument();
  });
  
  it('should filter photos when category is clicked', () => {
    render(<PortfolioPage />);
    
    // Initially, all photos should be displayed
    const initialPhotoCards = screen.getAllByTestId('photo-card');
    const initialCount = initialPhotoCards.length;
    
    // Click on a specific category
    fireEvent.click(screen.getByText('Concerts'));
    
    // Only Concerts photos should be displayed
    const filteredPhotoCards = screen.getAllByTestId('photo-card');
    const concertPhotos = filteredPhotoCards.filter(card => 
      card.textContent?.includes('Concerts')
    );
    
    // The filtered count should match the category photos
    expect(concertPhotos.length).toBe(filteredPhotoCards.length);
    // There should be fewer photos when filtered to a single category
    expect(filteredPhotoCards.length).toBeLessThan(initialCount);
  });
  
  it('should open lightbox when photo is clicked', () => {
    render(<PortfolioPage />);
    
    // Get all photo cards
    const photoCards = screen.getAllByTestId('photo-card');
    expect(photoCards.length).toBeGreaterThan(0);
    
    // Click on the first photo
    fireEvent.click(photoCards[0]);
    
    // Lightbox should be open
    expect(screen.getByTestId('lightbox-mock')).toBeInTheDocument();
  });
  
  it('should close lightbox when close button is clicked', () => {
    render(<PortfolioPage />);
    
    // Get all photo cards and click the first one
    const photoCards = screen.getAllByTestId('photo-card');
    fireEvent.click(photoCards[0]);
    
    // Verify lightbox is open
    const lightbox = screen.getByTestId('lightbox-mock');
    expect(lightbox).toBeInTheDocument();
    
    // Click close button
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    // Lightbox should be closed
    expect(screen.queryByTestId('lightbox-mock')).not.toBeInTheDocument();
  });
  
  it('should navigate to next and previous photos in lightbox', () => {
    render(<PortfolioPage />);
    
    // Get all photo cards and click the first one
    const photoCards = screen.getAllByTestId('photo-card');
    fireEvent.click(photoCards[0]);
    
    // Get initial main source
    const initialMainSrc = screen.getByText(/Current:/i).textContent;
    
    // Click next button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Source should have changed
    const afterNextSrc = screen.getByText(/Current:/i).textContent;
    expect(afterNextSrc).not.toBe(initialMainSrc);
    
    // Click previous button
    const prevButton = screen.getByText('Previous');
    fireEvent.click(prevButton);
    
    // Source should be back to initial
    const afterPrevSrc = screen.getByText(/Current:/i).textContent;
    expect(afterPrevSrc).toBe(initialMainSrc);
  });
});
