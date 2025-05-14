import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';
import { ImageProps } from 'next/image';
import { imageUrls } from '@/utils/imageUrls';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: ImageProps) => {
    // Convert boolean attributes to strings
    const convertedProps = Object.entries(props).reduce((acc, [key, value]) => {
      if (typeof value === 'boolean') {
        acc[key] = value.toString();
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    // eslint-disable-next-line @next/next/no-img-element
    return <img {...convertedProps} alt={props.alt || ''} />;
  },
}));

// Mock the Image component since it's a client component
jest.mock('@/components/common/Image', () => {
  return function MockImage({ alt, src }: { alt: string; src: string }) {
    return <img src={src} alt={alt} data-testid="mock-image" />;
  };
});

describe('HomePage', () => {
  it('renders hero section', () => {
    render(<HomePage />);
    expect(screen.getByText('MTP Collective')).toBeInTheDocument();
    expect(screen.getByText('Capturing moments through a unique lens')).toBeInTheDocument();
    expect(screen.getByAltText('MTP Collective Hero')).toBeInTheDocument();
  });

  it('renders featured photos section', () => {
    render(<HomePage />);
    expect(screen.getByText('Featured Photos')).toBeInTheDocument();
    const featuredImages = screen.getAllByAltText(/Featured photo \d/);
    expect(featuredImages).toHaveLength(3);
  });

  it('renders specialties section', () => {
    render(<HomePage />);
    expect(screen.getByText('Our Specialties')).toBeInTheDocument();
    expect(screen.getByText('concert')).toBeInTheDocument();
    expect(screen.getByText('automotive')).toBeInTheDocument();
    expect(screen.getByText('nature')).toBeInTheDocument();
  });

  it('renders about section', () => {
    render(<HomePage />);
    expect(screen.getByText('About MTP Collective')).toBeInTheDocument();
    expect(screen.getByText(/We are a collective of passionate photographers/)).toBeInTheDocument();
    expect(screen.getByText(/Our mission is to create timeless images/)).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<HomePage />);
    
    // Check main container
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-black', 'text-white');

    // Check hero section
    const heroSection = mainContainer.querySelector('section:first-child');
    expect(heroSection).toHaveClass('relative', 'h-[80vh]', 'w-full');

    // Check featured photos section
    const featuredSection = mainContainer.querySelector('section:nth-child(2)');
    expect(featuredSection).toHaveClass('py-24', 'px-4', 'md:px-8', 'bg-black');

    // Check specialties section
    const specialtiesSection = mainContainer.querySelector('section:nth-child(3)');
    expect(specialtiesSection).toHaveClass('py-24', 'px-4', 'md:px-8', 'bg-zinc-900');

    // Check about section
    const aboutSection = mainContainer.querySelector('section:last-child');
    expect(aboutSection).toHaveClass('py-24', 'px-4', 'md:px-8', 'bg-black');
  });
}); 