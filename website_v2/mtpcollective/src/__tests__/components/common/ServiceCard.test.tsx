import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServiceCard } from '@/components/common/ServiceCard';

describe('ServiceCard', () => {
  const mockIcon = <svg data-testid="mock-icon" />;
  
  it('renders the title correctly', () => {
    render(
      <ServiceCard 
        title="Test Service" 
        description="Test Description" 
        icon={mockIcon} 
      />
    );
    expect(screen.getByText('Test Service')).toBeInTheDocument();
  });

  it('renders the description correctly', () => {
    render(
      <ServiceCard 
        title="Test Service" 
        description="Test Description" 
        icon={mockIcon} 
      />
    );
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders the icon correctly', () => {
    render(
      <ServiceCard 
        title="Test Service" 
        description="Test Description" 
        icon={mockIcon} 
      />
    );
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <ServiceCard 
        title="Test Service" 
        description="Test Description" 
        icon={mockIcon} 
        className="custom-class"
      />
    );
    const cardDiv = container.firstChild as HTMLElement;
    expect(cardDiv).toHaveClass('custom-class');
  });
}); 