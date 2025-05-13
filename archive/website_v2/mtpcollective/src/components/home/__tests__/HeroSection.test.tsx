import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@/test/utils';
import HeroSection from '../HeroSection';

describe('HeroSection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders the main heading and description', () => {
    render(<HeroSection />);
    expect(screen.getByText('MTP COLLECTIVE')).toBeInTheDocument();
    expect(screen.getByText(/Capturing moments through a unique lens/i)).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<HeroSection />);
    expect(screen.getByRole('link', { name: /view gallery/i })).toHaveAttribute('href', '/photos');
    expect(screen.getByRole('link', { name: /get in touch/i })).toHaveAttribute('href', '/contact');
  });

  it('renders category indicators', () => {
    render(<HeroSection />);
    expect(screen.getByText('CONCERTS')).toBeInTheDocument();
    expect(screen.getByText('AUTOMOTIVE')).toBeInTheDocument();
    expect(screen.getByText('NATURE')).toBeInTheDocument();
  });

  it('automatically rotates through images', async () => {
    render(<HeroSection />);
    const imageContainers = screen.getAllByTestId('hero-image-container');
    expect(imageContainers[0]).toHaveClass('opacity-100');
    
    // Fast-forward 5 seconds
    await act(async () => {
      await vi.advanceTimersByTime(5000);
    });
    
    // Check that the second image container is now visible
    expect(imageContainers[1]).toHaveClass('opacity-100');
  });

  it('allows manual navigation through slide indicators', async () => {
    render(<HeroSection />);
    const indicators = screen.getAllByRole('button', { name: /go to slide/i });
    const imageContainers = screen.getAllByTestId('hero-image-container');
    
    // Click the second indicator
    await act(async () => {
      indicators[1].click();
    });
    
    expect(imageContainers[1]).toHaveClass('opacity-100');
  });
});
