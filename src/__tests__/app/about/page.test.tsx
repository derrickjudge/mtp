import { render, screen } from '@testing-library/react';
import AboutPage from '@/app/about/page';

// Mock the Image component
jest.mock('@/components/common/Image', () => ({
  Image: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

describe('AboutPage', () => {
  it('renders the hero section', async () => {
    const ui = await AboutPage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Our story and mission')).toBeInTheDocument();
    expect(screen.getByAltText('About MTP Collective')).toBeInTheDocument();
  });

  it('renders the our story section', async () => {
    const ui = await AboutPage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByText('Our Story')).toBeInTheDocument();
    expect(screen.getByText(/MTP Collective was born from a shared passion/i)).toBeInTheDocument();
  });

  it('renders the our mission section', async () => {
    const ui = await AboutPage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByText('Our Mission')).toBeInTheDocument();
    expect(screen.getByText(/At MTP Collective, we believe that every moment has a story/i)).toBeInTheDocument();
  });

  it('renders the team section', async () => {
    const ui = await AboutPage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByText('Our Team')).toBeInTheDocument();
    expect(screen.getByText('Meet the photographers behind MTP Collective')).toBeInTheDocument();
  });
}); 