'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '../components/ThemeProvider';

export default function AboutUsPage() {
  const theme = useTheme();
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-center">About MTP Collective</h1>
      
      {/* Hero Section */}
      <div className="relative w-full h-80 sm:h-96 mb-12 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-black opacity-40 z-10"></div>
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <h2 className="text-white text-3xl sm:text-4xl font-bold text-center px-4">
            Capturing moments through a unique lens
          </h2>
        </div>
        <Image
          src="/images/about-hero.jpg"
          alt="MTP Collective Photography"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
        />
      </div>
      
      {/* Our Story Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6 inline-block border-b-2 border-blue-500 pb-2">
          Our Story
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-lg mb-4">
              MTP Collective was founded in 2020 by a group of passionate photographers who shared a vision: to capture the world through a distinctive lens that tells compelling stories.
            </p>
            <p className="text-lg mb-4">
              Based in San Diego, California, we started as a small team covering local events and quickly expanded our portfolio to include automotive photography, concerts, nature, and editorial work.
            </p>
            <p className="text-lg">
              What began as a hobby transformed into a dedicated pursuit of visual storytelling, bringing together diverse perspectives and creative approaches that define our collective identity.
            </p>
          </div>
          <div className="relative h-80 rounded-xl overflow-hidden">
            <Image 
              src="/images/about-story.jpg" 
              alt="The beginning of MTP Collective" 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        </div>
      </section>
      
      {/* Our Approach Section */}
      <section className="mb-16 bg-gray-900 p-8 rounded-xl">
        <h2 className="text-3xl font-bold mb-6 inline-block border-b-2 border-blue-500 pb-2">
          Our Approach
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-black bg-opacity-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Authenticity</h3>
            <p>
              We believe in capturing genuine moments and real emotions. Our photography aims to tell authentic stories that resonate with viewers on a personal level.
            </p>
          </div>
          <div className="bg-black bg-opacity-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Creativity</h3>
            <p>
              We approach each project with fresh eyes and creative thinking. We're constantly experimenting with new techniques and perspectives to create unique visual narratives.
            </p>
          </div>
          <div className="bg-black bg-opacity-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Quality</h3>
            <p>
              We're committed to excellence in every aspect of our work. From composition and lighting to post-processing and delivery, we maintain the highest standards.
            </p>
          </div>
        </div>
      </section>
      
      {/* Meet the Team Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 inline-block border-b-2 border-blue-500 pb-2">
          Meet the Team
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Team Member 1 */}
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="relative h-80">
              <Image 
                src="/images/team-member1.jpg" 
                alt="Derrick Judge" 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Derrick Judge</h3>
              <p className="text-blue-400 mb-3">Founder & Lead Photographer</p>
              <p className="mb-4">
                Specializing in concert and automotive photography, Derrick brings a dynamic perspective to every shoot with 7+ years of experience.
              </p>
              <div className="flex space-x-3">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          {/* Team Member 2 */}
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="relative h-80">
              <Image 
                src="/images/team-member2.jpg" 
                alt="Michael Thompson" 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Michael Thompson</h3>
              <p className="text-blue-400 mb-3">Co-Founder & Nature Photographer</p>
              <p className="mb-4">
                Michael's landscape and wildlife photography brings the beauty of nature to life with stunning compositions and lighting.
              </p>
              <div className="flex space-x-3">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          {/* Team Member 3 */}
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="relative h-80">
              <Image 
                src="/images/team-member3.jpg" 
                alt="Patricia Lee" 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Patricia Lee</h3>
              <p className="text-blue-400 mb-3">Portrait & Event Photographer</p>
              <p className="mb-4">
                Patricia specializes in capturing genuine emotions and candid moments at events and in portrait sessions.
              </p>
              <div className="flex space-x-3">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Services Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 inline-block border-b-2 border-blue-500 pb-2">
          Our Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Event Photography</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Concerts & Music Festivals</li>
              <li>Corporate Events</li>
              <li>Social Gatherings</li>
              <li>Sports Events</li>
            </ul>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Automotive Photography</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Car Shows & Events</li>
              <li>Custom Vehicle Shoots</li>
              <li>Dealership Photography</li>
              <li>Racing & Motorsports</li>
            </ul>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Nature & Landscape</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Wildlife Photography</li>
              <li>Scenic Landscapes</li>
              <li>Nature Prints & Artwork</li>
              <li>Environmental Documentation</li>
            </ul>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Portrait Photography</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Individual Portraits</li>
              <li>Family Sessions</li>
              <li>Professional Headshots</li>
              <li>Creative & Artistic Portraits</li>
            </ul>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 inline-block border-b-2 border-blue-500 pb-2">
          What Our Clients Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-900 p-6 rounded-lg relative">
            <div className="text-4xl text-blue-500 absolute top-4 left-4 opacity-30">"</div>
            <div className="pt-6 px-4">
              <p className="italic mb-4">
                "MTP Collective captured the essence of our corporate event perfectly. The photos were delivered promptly and exceeded our expectations. We'll definitely be booking them for future events."
              </p>
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-xl font-bold">S</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm text-gray-400">Event Coordinator, TechCorp</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 p-6 rounded-lg relative">
            <div className="text-4xl text-blue-500 absolute top-4 left-4 opacity-30">"</div>
            <div className="pt-6 px-4">
              <p className="italic mb-4">
                "Working with MTP Collective for our car show was a fantastic experience. Their automotive photography is second to none, and they really understand how to showcase vehicles in their best light."
              </p>
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-xl font-bold">M</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold">Marcus Chen</p>
                  <p className="text-sm text-gray-400">San Diego Car Club</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="bg-blue-900 bg-opacity-30 p-10 rounded-xl text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Work With Us?</h2>
        <p className="mb-6 max-w-2xl mx-auto">
          Whether you're planning an event, need professional portraits, or want to collaborate on a creative project, we'd love to hear from you.
        </p>
        <Link href="/contact" className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors">
          Get in Touch
        </Link>
      </section>
    </div>
  );
}
