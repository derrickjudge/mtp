"use client";

import { ContactForm } from './ContactForm';
import type { ContactFormData } from './ContactForm';

export function ClientContactForm() {
  const handleSubmit = async (data: ContactFormData) => {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.message || 'Failed to send message');
    }
  };

  return <ContactForm onSubmit={handleSubmit} />;
} 