import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navigation from '@/components/layout/Navigation';

describe('Navigation', () => {
  it('renders the logo', () => {
    render(<Navigation />);
    expect(screen.getByText('MTP COLLECTIVE')).toBeInTheDocument();
  });

  it('renders all navigation links in desktop view', async () => {
    render(<Navigation />);
    const desktopNav = screen.getByRole('navigation').querySelector('.hidden.md\\:flex');
    
    expect(desktopNav).toBeInTheDocument();
    // Home link is the logo text; Desktop menu shows About, Portfolio, Articles, Events, Contact
    await waitFor(() => {
      expect(desktopNav).toHaveTextContent('Portfolio');
      expect(desktopNav).toHaveTextContent('Articles');
      expect(desktopNav).toHaveTextContent('About Us');
      expect(desktopNav).toHaveTextContent('Contact');
    });
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