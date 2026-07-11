import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;

// Must be a verified sending address/domain in Resend.
const CONTACT_FROM = 'MTP Collective <contact@mtpcollective.com>';
// Where contact form submissions land. Change here if it needs to move.
const CONTACT_RECIPIENT = 'derrickjudge@gmail.com';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// POST /api/contact - Send a contact-form submission via Resend
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`contact:POST:${ip}`, { tokens: 5, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      });
    }

    const { name, email, subject, message } = await req.json();

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ message: 'A valid email is required' }, { status: 400 });
    }
    if (typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json({ message: 'Subject is required' }, { status: 400 });
    }
    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 });
    }
    if (name.trim().length > MAX_FIELD_LENGTH || subject.trim().length > MAX_FIELD_LENGTH) {
      return NextResponse.json(
        { message: `Name and subject must be ${MAX_FIELD_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }
    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { message: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('Error sending contact email: RESEND_API_KEY is not configured');
      return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_RECIPIENT,
      replyTo: trimmedEmail,
      subject: `[MTP Contact] ${trimmedSubject}`,
      text: `New message from the MTP Collective contact form\n\nName: ${trimmedName}\nEmail: ${trimmedEmail}\n\n${trimmedMessage}`,
      html: `
        <p><strong>New message from the MTP Collective contact form</strong></p>
        <p><strong>Name:</strong> ${escapeHtml(trimmedName)}<br />
        <strong>Email:</strong> ${escapeHtml(trimmedEmail)}</p>
        <p>${escapeHtml(trimmedMessage).replace(/\n/g, '<br />')}</p>
      `,
    });

    if (error) {
      console.error('Error sending contact email:', error);
      return NextResponse.json({ message: 'Failed to send message' }, { status: 502 });
    }

    return NextResponse.json({ message: 'Message sent' }, { status: 200 });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
  }
}
