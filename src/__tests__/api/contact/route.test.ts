/**
 * Contact API Route Tests
 *
 * Tests for POST /api/contact: validation, rate limiting, and the Resend
 * email send call.
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/contact/route';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true })),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

import { rateLimit } from '@/lib/rateLimit';

const validBody = {
  name: 'Jane Rivera',
  email: 'jane@example.com',
  subject: 'Event coverage inquiry',
  message: 'Do you cover local rugby matches?',
};

const postRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ allowed: true });
    mockSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });
  });

  it('returns 400 when name is missing', async () => {
    const response = await POST(postRequest({ ...validBody, name: '  ' }));
    expect(response.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid email', async () => {
    const response = await POST(postRequest({ ...validBody, email: 'not-an-email' }));
    expect(response.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('returns 400 when subject is missing', async () => {
    const response = await POST(postRequest({ ...validBody, subject: '' }));
    expect(response.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('returns 400 when message is missing', async () => {
    const response = await POST(postRequest({ ...validBody, message: '' }));
    expect(response.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('returns 400 when the message exceeds the max length', async () => {
    const response = await POST(postRequest({ ...validBody, message: 'a'.repeat(5001) }));
    expect(response.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limited', async () => {
    (rateLimit as jest.Mock).mockReturnValue({ allowed: false, retryAfter: 30 });

    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('sends the email with the visitor as reply-to and the site owner as recipient', async () => {
    const response = await POST(postRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toMatch(/sent/i);
    expect(mockSend).toHaveBeenCalledTimes(1);

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.to).toBe('derrickjudge@gmail.com');
    expect(callArgs.replyTo).toBe('jane@example.com');
    expect(callArgs.subject).toContain('Event coverage inquiry');
    expect(callArgs.text).toContain('Jane Rivera');
    expect(callArgs.text).toContain('Do you cover local rugby matches?');
    expect(callArgs.html).toContain('Jane Rivera');
  });

  it('escapes HTML in user-supplied fields', async () => {
    await POST(postRequest({ ...validBody, name: '<script>alert(1)</script>' }));

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.html).not.toContain('<script>alert(1)</script>');
    expect(callArgs.html).toContain('&lt;script&gt;');
  });

  it('returns 502 when Resend returns an error', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'domain not verified', statusCode: 403, name: 'invalid_from_address' },
    });

    const response = await POST(postRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.message).toMatch(/failed/i);
  });

  it('returns 500 when RESEND_API_KEY is not configured', async () => {
    const original = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(500);
    expect(mockSend).not.toHaveBeenCalled();

    process.env.RESEND_API_KEY = original;
  });

  it('handles unexpected errors gracefully', async () => {
    mockSend.mockRejectedValue(new Error('network down'));

    const response = await POST(postRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toMatch(/failed/i);
  });
});
