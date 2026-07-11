/**
 * ClientContactForm Tests
 *
 * Verifies the form actually submits to /api/contact instead of being a
 * silent no-op stub.
 */

import { render } from '@testing-library/react';
import { ClientContactForm } from '@/components/common/ClientContactForm';

type SubmitHandler = (data: unknown) => Promise<void>;
let capturedOnSubmit: SubmitHandler | undefined;

jest.mock('@/components/common/ContactForm', () => ({
  ContactForm: ({ onSubmit }: { onSubmit: SubmitHandler }) => {
    capturedOnSubmit = onSubmit;
    return <div data-testid="contact-form-stub" />;
  },
}));

const formData = {
  name: 'Jane Rivera',
  email: 'jane@example.com',
  subject: 'Event coverage inquiry',
  message: 'Do you cover local rugby matches?',
};

describe('ClientContactForm', () => {
  beforeEach(() => {
    capturedOnSubmit = undefined;
    global.fetch = jest.fn();
  });

  it('posts the form data to /api/contact', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Message sent' }),
    });
    render(<ClientContactForm />);

    await capturedOnSubmit!(formData);

    expect(global.fetch).toHaveBeenCalledWith('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
  });

  it('does not throw on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<ClientContactForm />);

    await expect(capturedOnSubmit!(formData)).resolves.toBeUndefined();
  });

  it('throws the server error message when the request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'A valid email is required' }),
    });
    render(<ClientContactForm />);

    await expect(capturedOnSubmit!(formData)).rejects.toThrow('A valid email is required');
  });

  it('throws a fallback message when the error response has no JSON body', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('not json');
      },
    });
    render(<ClientContactForm />);

    await expect(capturedOnSubmit!(formData)).rejects.toThrow('Failed to send message');
  });
});
