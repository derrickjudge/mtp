import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';
import { ImageProps } from 'next/image';

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
  it('renders main hero copy', async () => {
    const ui = await HomePage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Every frame tells a story')).toBeInTheDocument();
    expect(screen.getByText('Waiting to be discovered')).toBeInTheDocument();
  });

  it('renders core call to action content', async () => {
    const ui = await HomePage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByText(/MTP Collective captures the raw energy of live music/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Portfolio' })).toHaveAttribute('href', '/portfolio');
  });

  it('applies current layout classes', async () => {
    const ui = await HomePage();
    render(ui as unknown as React.ReactElement);
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toHaveClass('bg-black', 'text-white');
    const heroSection = mainContainer.querySelector('section:first-child');
    expect(heroSection).toHaveClass('relative', 'w-screen', 'h-screen');
  });
}); 