'use client';

import React, { useState } from 'react';
import { useTheme } from '../components/ThemeProvider';
import Link from 'next/link';
import Image from 'next/image';

export default function ContactPage() {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Name validation with length check
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }
    
    // Email validation with more comprehensive regex
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Subject validation with length check
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.length > 200) {
      newErrors.subject = 'Subject must be less than 200 characters';
    }
    
    // Message validation with minimum and maximum length
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (formData.message.length > 5000) {
      newErrors.message = 'Message must be less than 5000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus({});
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmitStatus({
          success: true,
          message: 'Thank you for your message! We will get back to you soon.',
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
      } else {
        // Handle server validation errors
        if (data.errors && Object.keys(data.errors).length > 0) {
          // Set form errors from server
          setErrors(data.errors);
          setSubmitStatus({
            success: false,
            message: data.message || 'Please fix the errors in the form.',
          });
        } else {
          // General error message
          setSubmitStatus({
            success: false,
            message: data.message || 'Something went wrong. Please try again later.',
          });
        }
      }
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
    
    // If rate limit is hit, show a specific message
    if (submitStatus.message?.includes('rate limit')) {
      setSubmitStatus({
        success: false,
        message: 'Too many messages sent. Please try again later.',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact Information */}
        <div className="bg-black bg-opacity-50 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold mb-6">Get In Touch</h2>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="mr-4 text-xl">📍</div>
              <div>
                <h3 className="font-medium">Location</h3>
                <p className="text-gray-300">Based in San Diego, California</p>
                <p className="text-gray-300">Available for travel worldwide</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 text-xl">📧</div>
              <div>
                <h3 className="font-medium">Email</h3>
                <a 
                  href={`mailto:${theme.contactEmail || 'contact@mtpcollective.com'}`} 
                  className="text-blue-400 hover:text-blue-300 transition"
                >
                  {theme.contactEmail || 'contact@mtpcollective.com'}
                </a>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 text-xl">🌐</div>
              <div>
                <h3 className="font-medium">Social Media</h3>
                <div className="flex space-x-4 mt-2">
                  {theme.socialMedia?.instagram && (
                    <a 
                      href={`https://instagram.com/${theme.socialMedia.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      Instagram
                    </a>
                  )}
                  {theme.socialMedia?.facebook && (
                    <a 
                      href={`https://facebook.com/${theme.socialMedia.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      Facebook
                    </a>
                  )}
                  {theme.socialMedia?.twitter && (
                    <a 
                      href={`https://twitter.com/${theme.socialMedia.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-700">
              <h3 className="font-medium mb-3">Photography Services</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-300">
                <li>Event Photography</li>
                <li>Concert Photography</li>
                <li>Automotive Photography</li>
                <li>Nature & Landscapes</li>
                <li>Custom Photography</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Contact Form */}
        <div>
          {submitStatus.success ? (
            <div className="bg-green-800 bg-opacity-30 border border-green-700 p-6 rounded-lg text-center">
              <h3 className="text-xl font-semibold mb-3">Message Sent!</h3>
              <p className="mb-4">{submitStatus.message}</p>
              <button
                onClick={() => setSubmitStatus({})}
                className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded transition"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block mb-1 font-medium">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full p-3 bg-gray-900 border rounded focus:outline-none focus:ring-2 ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && <p className="mt-1 text-red-500 text-sm">{errors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block mb-1 font-medium">
                  Your Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-3 bg-gray-900 border rounded focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'
                  }`}
                  placeholder="john@example.com"
                />
                {errors.email && <p className="mt-1 text-red-500 text-sm">{errors.email}</p>}
              </div>
              
              <div>
                <label htmlFor="subject" className="block mb-1 font-medium">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full p-3 bg-gray-900 border rounded focus:outline-none focus:ring-2 ${
                    errors.subject ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select a subject</option>
                  <option value="Booking Inquiry">Booking Inquiry</option>
                  <option value="Price Information">Price Information</option>
                  <option value="Collaboration">Collaboration</option>
                  <option value="Print Order">Print Order</option>
                  <option value="Other">Other</option>
                </select>
                {errors.subject && <p className="mt-1 text-red-500 text-sm">{errors.subject}</p>}
              </div>
              
              <div>
                <label htmlFor="message" className="block mb-1 font-medium">
                  Your Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className={`w-full p-3 bg-gray-900 border rounded focus:outline-none focus:ring-2 ${
                    errors.message ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'
                  }`}
                  placeholder="Tell us about your project or inquiry..."
                />
                {errors.message && <p className="mt-1 text-red-500 text-sm">{errors.message}</p>}
              </div>
              
              <div className="flex items-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded text-white font-medium transition-colors ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
                
                {submitStatus.message && !submitStatus.success && (
                  <p className="ml-4 text-red-500">{submitStatus.message}</p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">Frequently Asked Questions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-2">What areas do you service?</h3>
            <p className="text-gray-300">
              We're based in San Diego, California, but available to travel nationwide and internationally 
              for the right projects. Travel fees may apply for locations outside San Diego County.
            </p>
          </div>
          
          <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-2">How much do your services cost?</h3>
            <p className="text-gray-300">
              Our pricing varies based on the type of photography, duration, location, and specific requirements. 
              Contact us with your project details for a custom quote.
            </p>
          </div>
          
          <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-2">How soon will I receive my photos?</h3>
            <p className="text-gray-300">
              Typically, you'll receive a gallery of edited photos within 2 weeks of your session. 
              Rush delivery may be available upon request for an additional fee.
            </p>
          </div>
          
          <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Can I purchase prints of your photos?</h3>
            <p className="text-gray-300">
              Yes! We offer high-quality prints in various sizes. Browse our gallery and use the 
              "Order Print" option, or contact us directly for custom print requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
