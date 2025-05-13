import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

describe('Home Page', () => {
  it('renders the hero section', () => {
    render(<Home />);
    expect(screen.getByText('MTP COLLECTIVE')).toBeInTheDocument();
    expect(screen.getByText(/Capturing moments through a unique lens/)).toBeInTheDocument();
  });

  it('renders the featured photos section', () => {
    render(<Home />);
    expect(screen.getByText('Featured Photography')).toBeInTheDocument();
  });

  it('renders the specialties section', () => {
    render(<Home />);
    expect(screen.getByText('Our Specialties')).toBeInTheDocument();
    expect(screen.getByText('Concert Photography')).toBeInTheDocument();
    expect(screen.getByText('Automotive Photography')).toBeInTheDocument();
    expect(screen.getByText('Nature Photography')).toBeInTheDocument();
  });

  it('renders the about section', () => {
    render(<Home />);
    expect(screen.getByText('About MTP Collective')).toBeInTheDocument();
    expect(screen.getByText(/We are a collective of passionate photographers/)).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    render(<Home />);
    expect(screen.getByText('Learn More About Us')).toBeInTheDocument();
  });
}); 