/**
 * Contact Form API Endpoint
 * Handles contact form submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import nodemailer from 'nodemailer';

// Rate limiter for contact form to prevent spam
// 5 submissions per hour per IP
const contactRateLimiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  limit: 5, // Allow only 5 submissions per hour per IP
  uniqueTokenPerInterval: 500, // Allow for 500 unique tokens per interval
});

// Input validation functions
function isValidEmail(email: string): boolean {
  // More comprehensive email regex that validates format more thoroughly
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function sanitizeInput(input: string): string {
  // Basic sanitization to prevent injection attacks
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function validateContactForm(formData: any): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Name validation
  if (!formData.name || formData.name.trim() === '') {
    errors.name = 'Name is required';
  } else if (formData.name.length > 100) {
    errors.name = 'Name must be less than 100 characters';
  }
  
  // Email validation
  if (!formData.email || formData.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Subject validation
  if (!formData.subject || formData.subject.trim() === '') {
    errors.subject = 'Subject is required';
  } else if (formData.subject.length > 200) {
    errors.subject = 'Subject must be less than 200 characters';
  }
  
  // Message validation
  if (!formData.message || formData.message.trim() === '') {
    errors.message = 'Message is required';
  } else if (formData.message.length < 10) {
    errors.message = 'Message must be at least 10 characters';
  } else if (formData.message.length > 5000) {
    errors.message = 'Message must be less than 5000 characters';
  }
  
  return { valid: Object.keys(errors).length === 0, errors };
}

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    try {
      const result = await contactRateLimiter.check(req);
      
      if (!result.success) {
        return NextResponse.json(
          { 
            message: 'Rate limit exceeded. Please try again later.' 
          },
          { status: 429 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get form data from request body
    const formData = await req.json();
    
    // Comprehensive validation of all form fields
    const validation = validateContactForm(formData);
    if (!validation.valid) {
      // Return the first error message
      const firstError = Object.values(validation.errors)[0];
      return NextResponse.json(
        { 
          message: firstError,
          errors: validation.errors 
        },
        { status: 400 }
      );
    }
    
    // Sanitize inputs to prevent injection attacks
    const name = sanitizeInput(formData.name);
    const email = sanitizeInput(formData.email);
    const subject = sanitizeInput(formData.subject);
    const message = sanitizeInput(formData.message);

    // Get contact email from environment variable or use default
    const contactEmail = process.env.CONTACT_EMAIL || 'contact@mtpcollective.com';
    
    // In development, just log the form submission
    if (process.env.NODE_ENV === 'development') {
      console.log('Contact form submission:', {
        name,
        email,
        subject,
        message,
        to: contactEmail,
      });
      
      // Simulate a delay like a real email would have
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json({ 
        message: 'Message sent successfully (development mode - email not actually sent)' 
      });
    }
    
    // In production, send the actual email
    try {
      // Configure nodemailer with environment variables
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      
      // Prepare email content with sanitized inputs
      const emailContent = {
        from: `"MTP Contact Form" <${process.env.SMTP_USER}>`,
        to: contactEmail,
        replyTo: email,
        subject: `[Contact Form] ${subject}`,
        text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
        `,
        html: `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
<p><small>Submitted from IP: [REDACTED] at ${new Date().toISOString()}</small></p>
        `,
      };
      
      // Send email
      await transporter.sendMail(emailContent);
      
      return NextResponse.json({ message: 'Message sent successfully' });
    } catch (error) {
      console.error('Email sending error:', error);
      
      return NextResponse.json(
        { message: 'Failed to send message. Please try again later.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Contact form error:', error);
    
    return NextResponse.json(
      { message: 'Server error. Please try again later.' },
      { status: 500 }
    );
  }
}
