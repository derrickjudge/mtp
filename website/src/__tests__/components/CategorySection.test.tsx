import React from 'react';
import { render, screen } from '@testing-library/react';
import CategorySection from '../../components/CategorySection';

// Mock next/image
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

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: any) => {
    return (
      <a href={href} className={className} data-testid="category-link">
        {children}
      </a>
    );
  },
}));

describe('CategorySection Component', () => {
  it('should render the categories section with heading', () => {
    render(<CategorySection />);
    
    // Check section heading
    expect(screen.getByText('Explore Categories')).toBeInTheDocument();
  });
  
  it('should render all category cards', () => {
    render(<CategorySection />);
    
    // Check that each category is rendered
    expect(screen.getByText('Concerts')).toBeInTheDocument();
    expect(screen.getByText('Automotive')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    
    // Check that category descriptions are rendered
    expect(screen.getByText(/Capturing the energy and atmosphere/i)).toBeInTheDocument();
    expect(screen.getByText(/Sleek lines and powerful machines/i)).toBeInTheDocument();
    expect(screen.getByText(/The beauty of natural landscapes/i)).toBeInTheDocument();
  });
  
  it('should render links with correct href attributes', () => {
    render(<CategorySection />);
    
    // Get all category links
    const categoryLinks = screen.getAllByTestId('category-link');
    expect(categoryLinks).toHaveLength(3);
    
    // Check that the links have the correct href attributes
    expect(categoryLinks[0]).toHaveAttribute('href', '/portfolio?category=concerts');
    expect(categoryLinks[1]).toHaveAttribute('href', '/portfolio?category=automotive');
    expect(categoryLinks[2]).toHaveAttribute('href', '/portfolio?category=nature');
  });
  
  it('should render images for each category', () => {
    render(<CategorySection />);
    
    // Check that images are rendered
    const images = screen.getAllByTestId('mock-image');
    expect(images).toHaveLength(3);
    
    // Verify images have src attributes (actual URLs will vary based on implementation)
    images.forEach(image => {
      expect(image).toHaveAttribute('src');
    });
  });
});
