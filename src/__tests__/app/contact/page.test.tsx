import { render, screen } from '@testing-library/react';
import ContactPage from '@/app/contact/page';

// Mock the Image component
jest.mock('@/components/common/Image', () => ({
  Image: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

// Mock the ClientContactForm component
jest.mock('@/components/common/ClientContactForm', () => ({
  ClientContactForm: () => <div data-testid="contact-form">Contact Form</div>,
}));

describe('ContactPage', () => {
  it('renders the hero section', async () => {
    const ui = await ContactPage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('Get in touch with our team')).toBeInTheDocument();
    expect(screen.getByAltText('Contact MTP Collective')).toBeInTheDocument();
  });

  it('renders the contact information section', async () => {
    const ui = await ContactPage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByText('Get in Touch')).toBeInTheDocument();
    expect(screen.getByText(/We'd love to hear from you/i)).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('contact@mtpcollective.com')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('(123) 456-7890')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Follow Us')).toBeInTheDocument();
  });

  it('renders the contact form', async () => {
    const ui = await ContactPage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getByTestId('contact-form')).toBeInTheDocument();
  });
}); 