'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="flex items-center justify-between">
      <Link href="/" className="text-xl font-bold tracking-wider">
        MTP COLLECTIVE
      </Link>
      
      {/* Desktop menu */}
      <div className="hidden md:flex items-center space-x-8">
        <Link href="/" className="text-gray-300 hover:text-white transition-colors">
          Home
        </Link>
        <Link href="/portfolio" className="text-gray-300 hover:text-white transition-colors">
          Portfolio
        </Link>
        <Link href="/articles" className="text-gray-300 hover:text-white transition-colors">
          Articles
        </Link>
        <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
          About Us
        </Link>
        <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
          Contact
        </Link>
      </div>

      {/* Mobile menu button */}
      <button 
        className="md:hidden text-gray-300 hover:text-white transition-colors"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Mobile menu */}
      <div 
        className={`${
          isMenuOpen ? 'block' : 'hidden'
        } md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md`}
      >
        <div className="px-4 py-2 space-y-1">
          <Link 
            href="/" 
            className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            href="/portfolio" 
            className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            Portfolio
          </Link>
          <Link 
            href="/articles" 
            className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            Articles
          </Link>
          <Link 
            href="/about" 
            className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            About Us
          </Link>
          <Link 
            href="/contact" 
            className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
} 