import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../../components/HomePage';

// Mock the imported components
jest.mock('../../components/HeroSection', () => {
  return function MockHeroSection() {
    return <div data-testid="hero-section-mock">Hero Section Mock</div>;
  };
});

jest.mock('../../components/FeaturedPhotos', () => {
  return function MockFeaturedPhotos(props: any) {
    return (
      <div data-testid="featured-photos-mock">
        Featured Photos Mock: {props.title}
      </div>
    );
  };
});

jest.mock('../../components/CategorySection', () => {
  return function MockCategorySection() {
    return <div data-testid="category-section-mock">Category Section Mock</div>;
  };
});

describe('HomePage Component', () => {
  it('should render the homepage with all sections', () => {
    render(<HomePage />);
    
    // Check that all sections are rendered
    expect(screen.getByTestId('hero-section-mock')).toBeInTheDocument();
    expect(screen.getByTestId('featured-photos-mock')).toBeInTheDocument();
    expect(screen.getByTestId('category-section-mock')).toBeInTheDocument();
    
    // Check for the About section
    expect(screen.getByText('About MTP Collective')).toBeInTheDocument();
    expect(screen.getByText(/photography studio specializing in concert/i)).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });
  
  it('should pass the correct props to FeaturedPhotos', () => {
    render(<HomePage />);
    
    // Check that FeaturedPhotos gets the correct props
    expect(screen.getByText(/Featured Photos Mock: Recent Work/i)).toBeInTheDocument();
  });
});
