'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-xl font-heading font-semibold text-white hover:text-gray-300 transition"
            >
              MTP Collective
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/photos" 
              className={`text-sm font-medium ${
                pathname.startsWith('/photos') 
                  ? 'text-white' 
                  : 'text-gray-300 hover:text-white'
              } transition`}
            >
              Photos
            </Link>
            <Link 
              href="/articles" 
              className={`text-sm font-medium ${
                pathname.startsWith('/articles') 
                  ? 'text-white' 
                  : 'text-gray-300 hover:text-white'
              } transition`}
            >
              Articles
            </Link>
            <Link 
              href="/about" 
              className={`text-sm font-medium ${
                pathname === '/about' 
                  ? 'text-white' 
                  : 'text-gray-300 hover:text-white'
              } transition`}
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className={`text-sm font-medium ${
                pathname === '/contact' 
                  ? 'text-white' 
                  : 'text-gray-300 hover:text-white'
              } transition`}
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
