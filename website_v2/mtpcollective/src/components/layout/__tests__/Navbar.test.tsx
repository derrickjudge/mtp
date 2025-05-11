import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import Navbar from '../Navbar';

describe('Navbar', () => {
  it('renders the logo text', () => {
    render(<Navbar />);
    expect(screen.getByText('MTP COLLECTIVE')).toBeInTheDocument();
  });

  it('renders desktop navigation links', () => {
    render(<Navbar />);
    const links = ['Home', 'Photos', 'Articles', 'About', 'Contact'];
    links.forEach(link => {
      expect(screen.getAllByRole('link', { name: link })[0]).toBeInTheDocument();
    });
  });

  it('renders mobile menu button', () => {
    render(<Navbar />);
    expect(
      screen.getByRole('button', { name: /open main menu/i })
    ).toBeInTheDocument();
  });

  it('toggles mobile menu when button is clicked', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    const mobileMenu = screen.getByLabelText(/mobile/i);
    expect(mobileMenu).toHaveClass('hidden');
    
    await user.click(menuButton);
    expect(mobileMenu).toHaveClass('block');
    
    await user.click(menuButton);
    expect(mobileMenu).toHaveClass('hidden');
  });

  it('closes mobile menu when a link is clicked', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    
    // Open menu
    await user.click(screen.getByRole('button', { name: /open main menu/i }));
    const mobileMenu = screen.getByLabelText(/mobile/i);
    expect(mobileMenu).toHaveClass('block');
    
    // Click a link
    await user.click(screen.getAllByRole('link', { name: 'About' })[1]); // Get the mobile menu link
    expect(mobileMenu).toHaveClass('hidden');
  });
});
