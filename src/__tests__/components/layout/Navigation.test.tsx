import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navigation from '@/components/layout/Navigation';

// jest.setup.js mocks usePathname as a fixed function; override it here so the
// active-link tests can vary the current route.
const mockUsePathname = jest.fn(() => '');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => mockUsePathname(),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Navigation', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('');
  });

  it('renders the text logo fallback when no logoUrl is provided', () => {
    render(<Navigation />);
    expect(screen.getByText('MTP COLLECTIVE')).toBeInTheDocument();
  });

  it('renders the real logo image immediately when logoUrl is provided, with no fetch/flash', () => {
    render(<Navigation logoUrl="https://cdn.example.com/logo.png" />);
    const logo = screen.getByAltText('MTP Collective');
    expect(logo).toBeInTheDocument();
    expect(screen.queryByText('MTP COLLECTIVE')).not.toBeInTheDocument();
  });

  it('renders all navigation links in desktop view', async () => {
    render(<Navigation />);
    const desktopNav = screen.getByRole('navigation').querySelector('.hidden.md\\:flex');
    
    expect(desktopNav).toBeInTheDocument();
    // Home link is the logo text; desktop menu shows About, Portfolio, Events,
    // Articles, Contact
    await waitFor(() => {
      expect(desktopNav).toHaveTextContent('Portfolio');
      expect(desktopNav).toHaveTextContent('Events');
      expect(desktopNav).toHaveTextContent('About Us');
      expect(desktopNav).toHaveTextContent('Articles');
      expect(desktopNav).toHaveTextContent('Contact');
    });
  });

  it('links Articles to /articles in the desktop menu, after Events', () => {
    render(<Navigation />);
    const desktopNav = screen.getByRole('navigation').querySelector('.hidden.md\\:flex');

    const hrefs = Array.from(desktopNav!.querySelectorAll('a')).map(a => a.getAttribute('href'));
    expect(hrefs).toContain('/articles');
    expect(hrefs.indexOf('/articles')).toBeGreaterThan(hrefs.indexOf('/events'));
    expect(hrefs.indexOf('/articles')).toBeLessThan(hrefs.indexOf('/contact'));
  });

  it('marks Articles as the current page when on /articles', () => {
    mockUsePathname.mockReturnValue('/articles');
    render(<Navigation />);

    const articlesLink = screen
      .getByRole('navigation')
      .querySelector('.hidden.md\\:flex a[href="/articles"]');
    expect(articlesLink).toHaveAttribute('aria-current', 'page');
  });

  it('includes an Articles link in the mobile menu', () => {
    render(<Navigation />);
    const mobileMenu = screen.getByRole('navigation').querySelector('.md\\:hidden.absolute');

    const hrefs = Array.from(mobileMenu!.querySelectorAll('a')).map(a => a.getAttribute('href'));
    expect(hrefs).toContain('/articles');
  });

  it('toggles mobile menu when button is clicked', () => {
    render(<Navigation />);
    const menuButton = screen.getByLabelText('Toggle menu');
    const mobileMenu = screen.getByRole('navigation').querySelector('.md\\:hidden.absolute');
    
    if (!mobileMenu) {
      throw new Error('Mobile menu element not found');
    }
    
    // Menu should be hidden initially
    expect(mobileMenu).toHaveClass('hidden');
    
    // Click menu button
    fireEvent.click(menuButton);
    
    // Menu should be visible
    expect(mobileMenu).not.toHaveClass('hidden');
    
    // Click menu button again
    fireEvent.click(menuButton);
    
    // Menu should be hidden again
    expect(mobileMenu).toHaveClass('hidden');
  });

  it('closes mobile menu when a link is clicked', () => {
    render(<Navigation />);
    const menuButton = screen.getByLabelText('Toggle menu');
    const mobileMenu = screen.getByRole('navigation').querySelector('.md\\:hidden.absolute');
    
    if (!mobileMenu) {
      throw new Error('Mobile menu element not found');
    }
    
    // Open menu
    fireEvent.click(menuButton);
    expect(mobileMenu).not.toHaveClass('hidden');
    
    // Click a link in mobile menu
    const mobileLinks = mobileMenu.querySelectorAll('a');
    if (mobileLinks.length === 0) {
      throw new Error('No mobile menu links found');
    }
    fireEvent.click(mobileLinks[0]);
    
    // Menu should be hidden
    expect(mobileMenu).toHaveClass('hidden');
  });
}); 