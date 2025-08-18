'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);

  // Fetch categories for portfolio dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        portfolioRef.current &&
        !portfolioRef.current.contains(event.target as Node)
      ) {
        setIsPortfolioDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsPortfolioDropdownOpen(false); // Close dropdown when mobile menu toggles
  };

  const togglePortfolioDropdown = () => {
    setIsPortfolioDropdownOpen(!isPortfolioDropdownOpen);
  };

  return (
    <nav className="flex items-center justify-between">
      <Link href="/" className="text-xl font-bold tracking-wider">
        MTP COLLECTIVE
      </Link>
      
      {/* Desktop menu */}
      <div className="hidden md:flex items-center space-x-8">
        <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
          About Us
        </Link>
        
        {/* Portfolio with dropdown */}
        <div className="relative" ref={portfolioRef}>
          <button
            onClick={togglePortfolioDropdown}
            className="flex items-center text-gray-300 hover:text-white transition-colors"
          >
            Portfolio
            <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isPortfolioDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Portfolio dropdown */}
          {isPortfolioDropdownOpen && (
            <div 
              ref={dropdownRef}
              className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50"
            >
              <Link
                href="/portfolio"
                className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors border-b border-gray-700"
                onClick={() => setIsPortfolioDropdownOpen(false)}
              >
                View All
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/portfolio?category=${category.slug}`}
                  className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  onClick={() => setIsPortfolioDropdownOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/articles" className="text-gray-300 hover:text-white transition-colors">
          Articles
        </Link>
        <Link href="/events" className="text-gray-300 hover:text-white transition-colors">
          Events
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
        } md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md z-50`}
      >
        <div className="px-4 py-2 space-y-1">
          <Link 
            href="/about" 
            className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            About Us
          </Link>
          
          {/* Portfolio section with categories */}
          <div className="space-y-1">
            <Link 
              href="/portfolio" 
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Portfolio - All
            </Link>
            {categories.map((category) => (
              <Link 
                key={category.id}
                href={`/portfolio?category=${category.slug}`} 
                className="block px-6 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
          </div>
          
          <Link 
            href="/articles" 
            className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            Articles
          </Link>
          <Link 
            href="/events" 
            className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md"
            onClick={() => setIsMenuOpen(false)}
          >
            Events
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