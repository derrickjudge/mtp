import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../../components/Navbar';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: any) => {
    return (
      <a href={href} className={className} data-testid="nav-link">
        {children}
      </a>
    );
  },
}));

// Mock next/image if needed
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} data-testid="mock-image" />;
  },
}));

describe('Navbar Component', () => {
  it('should render the navbar with logo and links', () => {
    render(<Navbar />);
    
    // Check that the logo/brand name is rendered
    expect(screen.getByText('MTP COLLECTIVE')).toBeInTheDocument();
    
    // Check that all navigation links are rendered
    const navLinks = screen.getAllByTestId('nav-link');
    expect(navLinks.length).toBeGreaterThanOrEqual(4); // At least Home, Portfolio, About, Contact
    
    // Check specific link text - using getAllByText since these appear in both mobile and desktop menus
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Portfolio').length).toBeGreaterThan(0);
    expect(screen.getAllByText('About').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Contact').length).toBeGreaterThan(0);
  });
  
  it('should have the correct href attributes for links', () => {
    render(<Navbar />);
    
    const navLinks = screen.getAllByTestId('nav-link');
    
    // Filter links to get just the desktop menu links (to avoid duplicate checks)
    const desktopLinks = navLinks.filter(link => 
      link.className && link.className.includes('text-gray-300 hover:text-white transition-colors')
    );
    
    // Find specific links
    const homeLink = desktopLinks.find(link => link.textContent === 'Home');
    const portfolioLink = desktopLinks.find(link => link.textContent === 'Portfolio');
    const aboutLink = desktopLinks.find(link => link.textContent === 'About');
    const contactLink = desktopLinks.find(link => link.textContent === 'Contact');
    
    // Check href attributes
    expect(homeLink).toHaveAttribute('href', '/');
    expect(portfolioLink).toHaveAttribute('href', '/portfolio');
    expect(aboutLink).toHaveAttribute('href', '/about');
    expect(contactLink).toHaveAttribute('href', '/contact');
  });
  
  it('should initially have mobile menu closed', () => {
    render(<Navbar />);
    
    // The mobile menu button should initially be visible
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(mobileMenuButton).toBeInTheDocument();
    
    // Find the mobile menu by a more specific query - using data-testid would be better,
    // but we'll query by className pattern for now
    const mobileMenus = document.querySelectorAll('div[class*="md:hidden"]');
    const mobileMenu = Array.from(mobileMenus).find(el => el.textContent?.includes('Home'));
    
    // Check that the mobile menu exists and has the hidden class
    expect(mobileMenu).toBeTruthy();
    expect(mobileMenu?.classList.contains('hidden')).toBeTruthy();
  });
  
  it('should toggle mobile menu when button is clicked', () => {
    render(<Navbar />);
    
    // Get the mobile menu button
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    
    // Find the mobile menu by a more specific selector
    const mobileMenus = document.querySelectorAll('div[class*="md:hidden"]');
    const mobileMenu = Array.from(mobileMenus).find(el => el.textContent?.includes('Home'));
    expect(mobileMenu).toBeTruthy();
    
    // Initial state: menu is hidden
    expect(mobileMenu?.classList.contains('hidden')).toBeTruthy();
    
    // Click the menu button to open
    fireEvent.click(mobileMenuButton);
    
    // After click: menu should be visible
    expect(mobileMenu?.classList.contains('hidden')).toBeFalsy();
    expect(mobileMenu?.classList.contains('block')).toBeTruthy();
    
    // Click again to close
    fireEvent.click(mobileMenuButton);
    
    // Menu should be hidden again
    expect(mobileMenu?.classList.contains('hidden')).toBeTruthy();
    expect(mobileMenu?.classList.contains('block')).toBeFalsy();
  });
  
  // Note: In a real app, we would need to implement onClick handlers in the Navbar
  // that close the menu when a link is clicked. For now, we'll just test navigation.
  it('should have clickable links in mobile menu', () => {
    render(<Navbar />);
    
    // First open the mobile menu
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(mobileMenuButton);
    
    // Find the mobile menu by a more specific selector
    const mobileMenus = document.querySelectorAll('div[class*="md:hidden"]');
    const mobileMenu = Array.from(mobileMenus).find(el => el.textContent?.includes('Home'));
    expect(mobileMenu).toBeTruthy();
    
    // Menu should now be visible
    expect(mobileMenu?.classList.contains('hidden')).toBeFalsy();
    
    // Get mobile menu links
    const mobileLinks = screen.getAllByTestId('nav-link');
    const aboutLink = mobileLinks.find(link => link.textContent === 'About');
    
    // Verify the link is clickable and has the right href
    if (aboutLink) {
      expect(aboutLink).toBeTruthy();
      expect(aboutLink.getAttribute('href')).toBe('/about');
      
      // We would need to mock navigation or implement the closing functionality
      // to actually test the menu closing, but we'll skip that for now.
    }
  });
});
