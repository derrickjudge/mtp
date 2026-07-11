import React from 'react';
import { render, screen } from '@testing-library/react';
import { SectionHeader } from '@/components/common/SectionHeader';

describe('SectionHeader', () => {
  it('renders the title correctly', () => {
    render(<SectionHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders the subtitle when provided', () => {
    render(<SectionHeader title="Test Title" subtitle="Test Subtitle" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('applies the alignment correctly', () => {
    const { container } = render(<SectionHeader title="Test Title" align="left" />);
    const headerDiv = container.firstChild as HTMLElement;
    expect(headerDiv).toHaveClass('text-left');
  });

  it('applies default center alignment if not specified', () => {
    const { container } = render(<SectionHeader title="Test Title" />);
    const headerDiv = container.firstChild as HTMLElement;
    expect(headerDiv).toHaveClass('text-center');
  });

  it('applies custom className when provided', () => {
    const { container } = render(<SectionHeader title="Test Title" className="custom-class" />);
    const headerDiv = container.firstChild as HTMLElement;
    expect(headerDiv).toHaveClass('custom-class');
  });

  it('does not cap subtitle width, regardless of alignment, so longer subtitles are not forced to wrap early', () => {
    const text = 'A longer subtitle that should be free to hold a single line';
    const { rerender } = render(<SectionHeader title="Test Title" subtitle={text} align="left" />);
    expect(screen.getByText(text)).not.toHaveClass('max-w-2xl');

    rerender(<SectionHeader title="Test Title" subtitle={text} align="center" />);
    expect(screen.getByText(text)).not.toHaveClass('max-w-2xl');
  });
}); 