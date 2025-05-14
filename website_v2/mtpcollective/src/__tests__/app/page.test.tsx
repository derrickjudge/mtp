import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';
import { ImageProps } from 'next/image';

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

describe('HomePage', () => {
  it('renders hero section', () => {
    render(<HomePage />);
    expect(screen.getByText(/capturing moments/i)).toBeInTheDocument();
  });

  it('renders featured photos section', () => {
    render(<HomePage />);
    expect(screen.getByText(/featured photos/i)).toBeInTheDocument();
  });

  it('renders specialties section', () => {
    render(<HomePage />);
    expect(screen.getByText(/concert photography/i)).toBeInTheDocument();
    expect(screen.getByText(/automotive photography/i)).toBeInTheDocument();
    expect(screen.getByText(/nature photography/i)).toBeInTheDocument();
  });

  it('renders about section', () => {
    render(<HomePage />);
    expect(screen.getByText(/about mtp collective/i)).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    render(<HomePage />);
    expect(screen.getByText(/home/i)).toBeInTheDocument();
    expect(screen.getByText(/portfolio/i)).toBeInTheDocument();
    expect(screen.getByText(/articles/i)).toBeInTheDocument();
    expect(screen.getByText(/about us/i)).toBeInTheDocument();
    expect(screen.getByText(/contact/i)).toBeInTheDocument();
  });
}); 