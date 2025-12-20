'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';

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
  const pathname = usePathname();

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const baseLink =
    'text-gray-300 hover:text-white transition-colors rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';
  const activeLink =
    'text-white relative after:absolute after:inset-x-1 after:-bottom-1 after:h-0.5 after:bg-white/80';

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
      <Link href="/" className="text-xl font-bold tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-md px-1">
        MTP COLLECTIVE
      </Link>
      
      {/* Desktop menu */}
      <div className="hidden md:flex items-center space-x-8">
        <Link href="/about" className={cn(baseLink, isActive('/about') && activeLink)} aria-current={isActive('/about') ? 'page' : undefined}>
          About Us
        </Link>
        
        {/* Portfolio with dropdown */}
        <div className="relative" ref={portfolioRef}>
          <button
            onClick={togglePortfolioDropdown}
            className={cn(baseLink, 'flex items-center', isActive('/portfolio') && activeLink)}
            aria-expanded={isPortfolioDropdownOpen}
            aria-haspopup="menu"
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
                className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors border-b border-gray-700 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                onClick={() => setIsPortfolioDropdownOpen(false)}
              >
                View All
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/portfolio?category=${category.slug}`}
                  className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  onClick={() => setIsPortfolioDropdownOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/events" className={cn(baseLink, isActive('/events') && activeLink)} aria-current={isActive('/events') ? 'page' : undefined}>
          Events
        </Link>
        <Link href="/contact" className={cn(baseLink, isActive('/contact') && activeLink)} aria-current={isActive('/contact') ? 'page' : undefined}>
          Contact
        </Link>
      </div>

      {/* Mobile menu button */}
      <button 
        className="md:hidden text-gray-300 hover:text-white transition-colors min-h-[44px] min-w-[44px] p-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
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
            className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            onClick={() => setIsMenuOpen(false)}
          >
            About Us
          </Link>
          
          {/* Portfolio section with categories */}
          <div className="space-y-1">
            <Link 
              href="/portfolio" 
              className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              onClick={() => setIsMenuOpen(false)}
            >
              Portfolio - All
            </Link>
            {categories.map((category) => (
              <Link 
                key={category.id}
                href={`/portfolio?category=${category.slug}`} 
                className="block px-6 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                onClick={() => setIsMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
          </div>
          
          <Link 
            href="/events" 
            className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            onClick={() => setIsMenuOpen(false)}
          >
            Events
          </Link>
          <Link 
            href="/contact" 
            className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            onClick={() => setIsMenuOpen(false)}
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
} 