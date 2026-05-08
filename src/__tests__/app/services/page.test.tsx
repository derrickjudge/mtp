import { render, screen } from '@testing-library/react';
import ServicesPage from '@/app/services/page';

// Mock the Image component
jest.mock('@/components/common/Image', () => ({
  Image: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

describe('ServicesPage', () => {
  it('renders the hero section', async () => {
    const ui = await ServicesPage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByText('Our Services')).toBeInTheDocument();
    expect(screen.getByText('Professional photography services for every occasion')).toBeInTheDocument();
    expect(screen.getByAltText('MTP Collective Services')).toBeInTheDocument();
  });

  it('renders the services grid section', async () => {
    const ui = await ServicesPage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByText('What We Offer')).toBeInTheDocument();
    expect(screen.getByText('Concert Photography')).toBeInTheDocument();
    expect(screen.getByText('Automotive Photography')).toBeInTheDocument();
    expect(screen.getByText('Nature Photography')).toBeInTheDocument();
  });

  it('renders the process section', async () => {
    const ui = await ServicesPage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByText('Our Process')).toBeInTheDocument();
    expect(screen.getByText('Consultation')).toBeInTheDocument();
    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('Shoot')).toBeInTheDocument();
    expect(screen.getByText('Delivery')).toBeInTheDocument();
  });
}); 