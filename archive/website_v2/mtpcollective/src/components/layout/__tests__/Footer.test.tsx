import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import Footer from '../Footer';

describe('Footer', () => {
  it('renders the logo text', () => {
    render(<Footer />);
    expect(screen.getByText('MTP COLLECTIVE')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<Footer />);
    expect(
      screen.getByText(/Capturing moments through a unique lens/i)
    ).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Footer />);
    const links = ['Home', 'Photos', 'Articles', 'About', 'Contact'];
    links.forEach(link => {
      expect(screen.getByRole('link', { name: link })).toBeInTheDocument();
    });
  });

  it('renders social media links', () => {
    render(<Footer />);
    const socialLinks = ['Instagram', 'Twitter'];
    socialLinks.forEach(link => {
      const socialLink = screen.getByRole('link', { name: link });
      expect(socialLink).toBeInTheDocument();
      expect(socialLink).toHaveAttribute('target', '_blank');
      expect(socialLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('renders the copyright notice with current year', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} MTP Collective`))).toBeInTheDocument();
  });
});
