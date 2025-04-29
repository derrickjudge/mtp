import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../../components/Footer';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: any) => {
    return (
      <a href={href} className={className} data-testid="footer-link">
        {children}
      </a>
    );
  },
}));

describe('Footer Component', () => {
  it('should render the footer with logo and description', () => {
    render(<Footer />);
    
    // Check for brand name
    expect(screen.getByText('MTP COLLECTIVE')).toBeInTheDocument();
    
    // Check for company description
    expect(screen.getByText(/Capturing moments through a unique lens/i)).toBeInTheDocument();
  });
  
  it('should display correct navigation links', () => {
    render(<Footer />);
    
    // Check for navigation section title - specify the exact element to avoid duplicate matches
    const quickLinksHeading = screen.getByRole('heading', { name: 'Quick Links' });
    expect(quickLinksHeading).toBeInTheDocument();
    
    // Check individual links
    const footerLinks = screen.getAllByTestId('footer-link');
    const linkTexts = footerLinks.map(link => link.textContent);
    
    expect(linkTexts).toContain('Home');
    expect(linkTexts).toContain('Portfolio');
    expect(linkTexts).toContain('About');
    expect(linkTexts).toContain('Contact');
  });
  
  it('should display social media links', () => {
    render(<Footer />);
    
    // Check for social media links
    const instagramLink = screen.getByRole('link', { name: /instagram/i });
    const twitterLink = screen.getByRole('link', { name: /twitter/i });
    
    expect(instagramLink).toBeInTheDocument();
    expect(twitterLink).toBeInTheDocument();
    
    expect(instagramLink).toHaveAttribute('href', 'https://instagram.com');
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com');
  });
  
  it('should display contact information', () => {
    render(<Footer />);
    
    // Check for contact section title - specify role to avoid duplicate matches
    const contactHeading = screen.getByRole('heading', { name: 'Contact' });
    expect(contactHeading).toBeInTheDocument();
    
    // Check for location
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    
    // Check for email
    const emailLink = screen.getByText('contact@mtpcollective.com');
    expect(emailLink).toBeInTheDocument();
    expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:contact@mtpcollective.com');
  });
  
  it('should display the copyright with current year', () => {
    // Mock the Date constructor to return a fixed date
    const originalDate = global.Date;
    const mockDate = class extends Date {
      getFullYear() {
        return 2025;
      }
    };
    global.Date = mockDate as DateConstructor;
    
    render(<Footer />);
    
    // Check for copyright text with the mocked year
    expect(screen.getByText(/© 2025 MTP Collective. All rights reserved./i)).toBeInTheDocument();
    
    // Restore the original Date constructor
    global.Date = originalDate;
  });
});
