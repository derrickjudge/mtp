'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';

interface Category {
  id: string;
  name: string;
  slug: string;
  showInNav?: boolean;
  parentId?: string | null;
  children?: Category[];
}

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(false);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const [mobileExpandedParent, setMobileExpandedParent] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const baseLink =
    'text-gray-300 hover:text-white transition-colors rounded-md px-3 py-2 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';
  const activeLink =
    'text-white relative after:absolute after:inset-x-1 after:-bottom-1 after:h-0.5 after:bg-white/80';

  // Fetch categories and logo
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?hierarchy=true');
        if (response.ok) {
          const data: Category[] = await response.json();
          // Filter to only show categories where showInNav is true
          const filtered = data
            .filter(cat => cat.showInNav !== false)
            .map(parent => ({
              ...parent,
              children: (parent.children || []).filter(child => child.showInNav !== false)
            }));
          setCategories(filtered);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/settings?key=site:logo');
        if (response.ok) {
          const data = await response.json();
          if (data?.value) {
            setLogoUrl(data.value);
          }
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    };

    fetchCategories();
    fetchLogo();
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
        setExpandedParent(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsPortfolioDropdownOpen(false);
    setMobileExpandedParent(null);
  };

  const togglePortfolioDropdown = () => {
    setIsPortfolioDropdownOpen(!isPortfolioDropdownOpen);
    setExpandedParent(null);
  };

  const toggleMobileParent = (parentId: string) => {
    setMobileExpandedParent(mobileExpandedParent === parentId ? null : parentId);
  };

  // Get display name (remove parent prefix from Signature Shots)
  const getDisplayName = (name: string) => {
    // Remove "Parent: " prefix for cleaner display
    if (name.includes(': ')) {
      return name.split(': ')[1];
    }
    return name;
  };

  return (
    <nav className="flex items-center justify-between">
      <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-md">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt="MTP Collective"
            width={225}
            height={75}
            className="h-[75px] w-auto object-left object-contain"
            priority
          />
        ) : (
          <span className="text-xl font-bold tracking-wider px-1">MTP COLLECTIVE</span>
        )}
      </Link>
      
      {/* Desktop menu */}
      <div className="hidden md:flex items-center space-x-8">
        <Link href="/about" className={cn(baseLink, isActive('/about') && activeLink)} aria-current={isActive('/about') ? 'page' : undefined}>
          About Us
        </Link>
        
        {/* Portfolio with hierarchical dropdown */}
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
          
          {/* Portfolio dropdown with inline hierarchy */}
          {isPortfolioDropdownOpen && (
            <div 
              ref={dropdownRef}
              className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-[70vh] overflow-y-auto"
            >
              <Link
                href="/portfolio"
                className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors border-b border-gray-700 rounded-t-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                onClick={() => setIsPortfolioDropdownOpen(false)}
              >
                View All Photos
              </Link>
              
              {categories.map((parent, index) => (
                <div 
                  key={parent.id} 
                  className={cn(
                    "border-b border-gray-700/50 last:border-b-0",
                    index === categories.length - 1 && "last:rounded-b-lg"
                  )}
                >
                  {/* Parent category header with expand toggle */}
                  <div className="flex items-center">
                    <Link
                      href={`/portfolio?category=${parent.slug}`}
                      className="flex-1 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 font-medium"
                      onClick={() => setIsPortfolioDropdownOpen(false)}
                    >
                      {parent.name}
                    </Link>
                    {parent.children && parent.children.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedParent(expandedParent === parent.id ? null : parent.id);
                        }}
                        className="px-3 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                        aria-label={`Expand ${parent.name} subcategories`}
                      >
                        <ChevronDownIcon 
                          className={`w-4 h-4 transition-transform duration-200 ${expandedParent === parent.id ? 'rotate-180' : ''}`} 
                        />
                      </button>
                    )}
                  </div>
                  
                  {/* Inline subcategories (accordion) */}
                  {expandedParent === parent.id && parent.children && parent.children.length > 0 && (
                    <div className="bg-gray-800/50 border-t border-gray-700/50">
                      {parent.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/portfolio?category=${child.slug}`}
                          className="block px-6 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                          onClick={() => {
                            setIsPortfolioDropdownOpen(false);
                            setExpandedParent(null);
                          }}
                        >
                          {getDisplayName(child.name)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
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
        } md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md z-50 max-h-[80vh] overflow-y-auto`}
      >
        <div className="px-4 py-2 space-y-1">
          <Link 
            href="/about" 
            className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            onClick={() => setIsMenuOpen(false)}
          >
            About Us
          </Link>
          
          {/* Portfolio section with hierarchical categories */}
          <div className="space-y-1">
            <Link 
              href="/portfolio" 
              className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              onClick={() => setIsMenuOpen(false)}
            >
              Portfolio - All
            </Link>
            
            {categories.map((parent) => (
              <div key={parent.id} className="space-y-1">
                {/* Parent category with expand toggle */}
                <div className="flex items-center">
                  <Link 
                    href={`/portfolio?category=${parent.slug}`}
                    className="flex-1 px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {parent.name}
                  </Link>
                  {parent.children && parent.children.length > 0 && (
                    <button
                      onClick={() => toggleMobileParent(parent.id)}
                      className="p-3 text-gray-400 hover:text-white"
                      aria-label={`Expand ${parent.name} subcategories`}
                    >
                      <ChevronDownIcon 
                        className={`w-5 h-5 transition-transform ${mobileExpandedParent === parent.id ? 'rotate-180' : ''}`} 
                      />
                    </button>
                  )}
                </div>
                
                {/* Subcategories */}
                {mobileExpandedParent === parent.id && parent.children && parent.children.length > 0 && (
                  <div className="pl-4 space-y-1 border-l-2 border-gray-700 ml-4">
                    {parent.children.map((child) => (
                      <Link 
                        key={child.id}
                        href={`/portfolio?category=${child.slug}`}
                        className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-900 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {getDisplayName(child.name)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
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
