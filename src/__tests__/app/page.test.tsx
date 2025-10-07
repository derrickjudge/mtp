import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';
import { ImageProps } from 'next/image';
import { imageUrls } from '@/utils/imageUrls';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '',
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

// Mock the Image component
jest.mock('@/components/common/Image', () => ({
  Image: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

describe('HomePage', () => {
  it('renders the hero section', async () => {
    // Mock DB to return no data for deterministic UI
    const { nativeDB } = require('@/lib/db-native');
    nativeDB.findPhotos.mockResolvedValueOnce([]); // featured
    nativeDB.findCategories.mockResolvedValueOnce([]); // categories
    const ui = await HomePage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByRole('main')).toBeInTheDocument();
    // Use getAllByText to handle multiple instances
    expect(screen.getAllByText(/MTP Collective/i)[0]).toBeInTheDocument();
    // Updated to match the actual text
    expect(screen.getByText(/Capturing moments through a unique lens/i)).toBeInTheDocument();
  });

  it('renders the featured photos section', async () => {
    const { nativeDB } = require('@/lib/db-native');
    nativeDB.findPhotos.mockResolvedValueOnce([]);
    nativeDB.findCategories.mockResolvedValueOnce([]);
    const ui = await HomePage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByText('Featured Photos')).toBeInTheDocument();
    const featuredSection = screen.getByText('Featured Photos').closest('section');
    expect(featuredSection).toBeInTheDocument();
  });

  it('renders the specialties section empty state when no categories/photos', async () => {
    const { nativeDB } = require('@/lib/db-native');
    nativeDB.findPhotos.mockResolvedValueOnce([]); // featured
    nativeDB.findCategories.mockResolvedValueOnce([]); // categories
    const ui = await HomePage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByText('Our Specialties')).toBeInTheDocument();
    expect(
      screen.getByText(/Our photography specialties are being curated/i)
    ).toBeInTheDocument();
    expect(screen.getByText('View Portfolio')).toBeInTheDocument();
  });

  it('renders the about section', async () => {
    const { nativeDB } = require('@/lib/db-native');
    nativeDB.findPhotos.mockResolvedValueOnce([]);
    nativeDB.findCategories.mockResolvedValueOnce([]);
    const ui = await HomePage();
    render(ui as unknown as React.ReactElement);
    // Update to match actual text in the component
    expect(screen.getByText('About MTP Collective')).toBeInTheDocument();
    expect(screen.getByText(/We are a collective of passionate photographers/i)).toBeInTheDocument();
    // Look for text in the mission statement
    expect(screen.getByText(/Our mission is to create timeless images/i)).toBeInTheDocument();
  });

  it('applies correct styling classes', async () => {
    const { nativeDB } = require('@/lib/db-native');
    nativeDB.findPhotos.mockResolvedValueOnce([]);
    nativeDB.findCategories.mockResolvedValueOnce([]);
    const ui = await HomePage();
    render(ui as unknown as React.ReactElement);
    
    // Check main container
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-black', 'text-white');

    // Check hero section
    const heroSection = mainContainer.querySelector('section:first-child');
    expect(heroSection).toHaveClass('relative', 'w-full');
    expect(heroSection).toHaveStyle({ height: '80vh' });

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