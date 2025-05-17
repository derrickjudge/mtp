"use client";

import { ContactForm } from './ContactForm';
import type { ContactFormData } from './ContactForm';

export function ClientContactForm() {
  const handleSubmit = async (data: ContactFormData) => {
    // TODO: Implement form submission
    console.log('Form submitted:', data);
  };

  return <ContactForm onSubmit={handleSubmit} />;
} 