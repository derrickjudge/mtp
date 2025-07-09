'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  PhotoIcon, 
  TagIcon, 
  DocumentTextIcon, 
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Photos', href: '/admin/photos', icon: PhotoIcon },
  { name: 'Categories', href: '/admin/categories', icon: TagIcon },
  { name: 'Articles', href: '/admin/articles', icon: DocumentTextIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <PhotoIcon className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3">
            <h2 className="text-lg font-semibold text-white">MTP Admin</h2>
            <p className="text-sm text-gray-400">Photography Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 flex-shrink-0 h-5 w-5 transition-colors
                  ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                `}
              />
              {item.name}
              {item.count && (
                <span className="ml-auto inline-block py-0.5 px-2 text-xs rounded-full bg-gray-600 text-gray-200">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          <p>MTP Collective Admin</p>
          <p>Version 1.0</p>
        </div>
      </div>
    </div>
  );
} 