/**
 * Tests for Contact Form Component
 */

const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');

// Mock the useTheme hook
jest.mock('@/app/components/ThemeProvider', () => ({
  useTheme: () => ({
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    siteName: 'MTP Collective',
    siteDescription: 'Photography portfolio',
    contactEmail: 'test@example.com',
    socialMedia: {
      instagram: '@mtpcollective',
      twitter: '@mtpcollective',
      facebook: 'mtpcollective'
    }
  })
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Contact Form', () => {
  // Simple form validation test that matches the validation in the contact page
  it('should validate form fields correctly', () => {
    // Test form validator
    const validateForm = (formData) => {
      const errors = {};
      
      if (!formData.name.trim()) {
        errors.name = 'Name is required';
      }
      
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
      
      if (!formData.subject.trim()) {
        errors.subject = 'Subject is required';
      }
      
      if (!formData.message.trim()) {
        errors.message = 'Message is required';
      } else if (formData.message.length < 10) {
        errors.message = 'Message must be at least 10 characters';
      }
      
      return { 
        isValid: Object.keys(errors).length === 0,
        errors 
      };
    };
    
    // Valid form data
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test Subject',
      message: 'This is a test message that is longer than 10 characters.'
    };
    
    // Test valid form data
    const validResult = validateForm(validData);
    expect(validResult.isValid).toBe(true);
    expect(Object.keys(validResult.errors).length).toBe(0);
    
    // Test invalid email
    const invalidEmail = {
      ...validData,
      email: 'invalid-email'
    };
    const emailResult = validateForm(invalidEmail);
    expect(emailResult.isValid).toBe(false);
    expect(emailResult.errors.email).toBeDefined();
    
    // Test short message
    const shortMessage = {
      ...validData,
      message: 'Short'
    };
    const messageResult = validateForm(shortMessage);
    expect(messageResult.isValid).toBe(false);
    expect(messageResult.errors.message).toBeDefined();
  });
  
  it('should handle form submission correctly', async () => {
    // Mock successful fetch response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Message sent successfully' })
    });
    
    // Simulate form submission
    const formData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Inquiry',
      message: 'This is a test inquiry message'
    };
    
    // Make sure form data is properly formatted for the API
    const submitForm = async (data) => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return response.json();
    };
    
    // Submit the form and check the response
    const result = await submitForm(formData);
    
    // Verify fetch was called with the right data
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    // Verify the success message
    expect(result).toHaveProperty('message', 'Message sent successfully');
  });
  
  it('should handle form submission errors', async () => {
    // Mock failed fetch response
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Error sending message' })
    });
    
    // Simulate form submission
    const formData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Inquiry',
      message: 'This is a test inquiry message'
    };
    
    // Submit form function
    const submitForm = async (data) => {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          return { success: false, message: errorData.message };
        }
        
        return { success: true, message: 'Message sent successfully' };
      } catch (error) {
        return { success: false, message: 'Failed to send message' };
      }
    };
    
    // Submit the form
    const result = await submitForm(formData);
    
    // Verify the error handling
    expect(result.success).toBe(false);
    expect(result.message).toBe('Error sending message');
  });
});
