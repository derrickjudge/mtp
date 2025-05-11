import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import HomePage from '../HomePage';

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />);
    expect(screen.getByText('MTP COLLECTIVE')).toBeInTheDocument();
  });

  it('renders the hero section', () => {
    render(<HomePage />);
    expect(screen.getByText(/Capturing moments through a unique lens/i)).toBeInTheDocument();
  });

  it('renders call-to-action buttons', () => {
    render(<HomePage />);
    expect(screen.getByRole('link', { name: /view gallery/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get in touch/i })).toBeInTheDocument();
  });

  it('renders all sections', () => {
    render(<HomePage />);
    expect(screen.getByText(/featured photography/i)).toBeInTheDocument();
    expect(screen.getByText(/our specialties/i)).toBeInTheDocument();
    expect(screen.getByText(/about mtp collective/i)).toBeInTheDocument();
  });
});
