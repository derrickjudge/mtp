'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  BellIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon 
} from '@heroicons/react/24/outline';

export function AdminHeader() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  const handleViewSite = () => {
    window.open('/', '_blank');
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Breadcrumb or page title will go here */}
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-white">
            Admin Panel
          </h1>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-4">
          {/* View Site Button */}
          <button
            onClick={handleViewSite}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 hover:text-white transition-colors"
          >
            View Site
          </button>

          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <BellIcon className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <Cog6ToothIcon className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <UserCircleIcon className="w-8 h-8 text-gray-400" />
              <div className="text-sm">
                <div className="text-white font-medium">
                  {session?.user?.email || 'Admin User'}
                </div>
                <div className="text-gray-400">
                  {session?.user?.role || 'ADMIN'}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-red-600 rounded-md hover:bg-red-700 hover:text-white transition-colors"
              title="Sign Out"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 