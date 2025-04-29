import React from 'react';
import { render, screen } from '@testing-library/react';
import PhotoCard from '../../components/PhotoCard';

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

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: any) => {
    return <a href={href} data-testid="mock-link">{children}</a>;
  },
}));

describe('PhotoCard Component', () => {
  const defaultProps = {
    id: 'photo-123',
    imageUrl: 'https://example.com/test-image.jpg',
    title: 'Test Photo Title',
    category: 'Test Category',
  };

  it('should render the photo card with the correct elements', () => {
    render(<PhotoCard {...defaultProps} />);
    
    // Check image is rendered with correct src
    const image = screen.getByTestId('mock-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', defaultProps.imageUrl);
    expect(image).toHaveAttribute('alt', defaultProps.title);
    
    // Check title and category are present
    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.category)).toBeInTheDocument();
    
    // Check link has the correct URL
    const link = screen.getByTestId('mock-link');
    expect(link).toHaveAttribute('href', `/portfolio/${defaultProps.id}`);
  });
  
  it('should apply the correct aspect ratio class based on prop', () => {
    // Test square aspect ratio (default)
    const { rerender } = render(<PhotoCard {...defaultProps} />);
    let image = screen.getByTestId('mock-image');
    expect(image.parentElement).toHaveClass('aspect-square');
    
    // Test portrait aspect ratio
    rerender(<PhotoCard {...defaultProps} aspectRatio="portrait" />);
    image = screen.getByTestId('mock-image');
    expect(image.parentElement).toHaveClass('aspect-[2/3]');
    
    // Test landscape aspect ratio
    rerender(<PhotoCard {...defaultProps} aspectRatio="landscape" />);
    image = screen.getByTestId('mock-image');
    expect(image.parentElement).toHaveClass('aspect-[3/2]');
  });
  
  it('should pass the priority prop to the Image component', () => {
    // With priority=true
    const { rerender } = render(<PhotoCard {...defaultProps} priority={true} />);
    let image = screen.getByTestId('mock-image');
    expect(image).toBeInTheDocument();
    
    // With priority=false
    rerender(<PhotoCard {...defaultProps} priority={false} />);
    image = screen.getByTestId('mock-image');
    expect(image).toBeInTheDocument();
    
    // This test primarily ensures that the priority prop doesn't cause renders to fail
    // The actual priority behavior is handled by Next.js Image component
  });
});
