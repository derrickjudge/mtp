// Test file for the admin header component
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminHeader from '@/app/admin/components/Header';

// Mock usePathname hook from next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/admin/dashboard'),
}));

describe('AdminHeader Component', () => {
  it('renders admin header with navigation links', () => {
    render(<AdminHeader />);
    
    // Check the header title
    expect(screen.getByText('MTP Collective Admin')).toBeInTheDocument();
    
    // Check navigation links
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Photos')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
  
  it('applies active class to current section', () => {
    // Mock being on the dashboard page
    require('next/navigation').usePathname.mockReturnValue('/admin/dashboard');
    
    const { container } = render(<AdminHeader />);
    
    // Find the li element containing "Dashboard" and check if it has the "active" class
    const dashboardLi = Array.from(container.querySelectorAll('li')).find(
      li => li.textContent === 'Dashboard'
    );
    
    expect(dashboardLi).toHaveClass('active');
    
    // Other nav items should not have the active class
    const photosLi = Array.from(container.querySelectorAll('li')).find(
      li => li.textContent === 'Photos'
    );
    
    expect(photosLi).not.toHaveClass('active');
  });
  
  it('highlights different section when on another page', () => {
    // Mock being on the users page
    require('next/navigation').usePathname.mockReturnValue('/admin/users');
    
    const { container } = render(<AdminHeader />);
    
    // Dashboard should not be active
    const dashboardLi = Array.from(container.querySelectorAll('li')).find(
      li => li.textContent === 'Dashboard'
    );
    expect(dashboardLi).not.toHaveClass('active');
    
    // Users should be active
    const usersLi = Array.from(container.querySelectorAll('li')).find(
      li => li.textContent === 'Users'
    );
    expect(usersLi).toHaveClass('active');
  });
});
