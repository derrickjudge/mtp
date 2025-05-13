import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from '@/components/layout/Navigation';

describe('Navigation', () => {
  it('renders the logo', () => {
    render(<Navigation />);
    expect(screen.getByText('MTP COLLECTIVE')).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    render(<Navigation />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Articles')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('toggles mobile menu when button is clicked', () => {
    render(<Navigation />);
    const menuButton = screen.getByLabelText('Toggle menu');
    
    // Menu should be hidden initially
    expect(screen.queryByText('Home')).not.toHaveClass('block');
    
    // Click menu button
    fireEvent.click(menuButton);
    
    // Menu should be visible
    expect(screen.getByText('Home')).toHaveClass('block');
    
    // Click menu button again
    fireEvent.click(menuButton);
    
    // Menu should be hidden again
    expect(screen.queryByText('Home')).not.toHaveClass('block');
  });

  it('closes mobile menu when a link is clicked', () => {
    render(<Navigation />);
    const menuButton = screen.getByLabelText('Toggle menu');
    
    // Open menu
    fireEvent.click(menuButton);
    
    // Click a link
    fireEvent.click(screen.getByText('Home'));
    
    // Menu should be hidden
    expect(screen.queryByText('Home')).not.toHaveClass('block');
  });
}); 