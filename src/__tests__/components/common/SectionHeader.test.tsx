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

  it('does not cap subtitle width for left alignment, so it can hold a single line', () => {
    render(<SectionHeader title="Test Title" subtitle="A longer subtitle that should stay on one line" align="left" />);
    const subtitle = screen.getByText('A longer subtitle that should stay on one line');
    expect(subtitle).not.toHaveClass('max-w-2xl');
  });

  it('keeps a reading-width cap on centered subtitles', () => {
    render(<SectionHeader title="Test Title" subtitle="A centered subtitle" align="center" />);
    const subtitle = screen.getByText('A centered subtitle');
    expect(subtitle).toHaveClass('max-w-2xl');
  });
}); 