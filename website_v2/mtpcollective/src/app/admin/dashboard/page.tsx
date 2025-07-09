'use client';

import React, { useState, useEffect } from 'react';
import { 
  PhotoIcon, 
  TagIcon, 
  DocumentTextIcon, 
  UsersIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DashboardStats {
  photos: number;
  categories: number;
  articles: number;
  users: number;
  recentPhotos: Array<{
    id: string;
    title: string;
    url: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    photos: 0,
    categories: 0,
    articles: 0,
    users: 0,
    recentPhotos: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch all stats in parallel
      const [photosRes, categoriesRes, usersRes] = await Promise.all([
        fetch('/api/photos'),
        fetch('/api/categories'),
        fetch('/api/users')
      ]);

      const [photosData, categoriesData, usersData] = await Promise.all([
        photosRes.json(),
        categoriesRes.json(),
        usersRes.json()
      ]);

      setStats({
        photos: photosData.photos?.length || photosData.length || 0,
        categories: categoriesData.length || 0,
        articles: 0, // TODO: Implement articles API
        users: usersData.length || 0,
        recentPhotos: photosData.photos?.slice(0, 4) || photosData.slice(0, 4) || []
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Photos',
      value: stats.photos,
      icon: PhotoIcon,
      color: 'bg-blue-500',
      href: '/admin/photos'
    },
    {
      name: 'Categories',
      value: stats.categories,
      icon: TagIcon,
      color: 'bg-green-500',
      href: '/admin/categories'
    },
    {
      name: 'Articles',
      value: stats.articles,
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      href: '/admin/articles'
    },
    {
      name: 'Users',
      value: stats.users,
      icon: UsersIcon,
      color: 'bg-orange-500',
      href: '/admin/users'
    }
  ];

  const quickActions = [
    {
      name: 'Upload Photo',
      description: 'Add new photos to your portfolio',
      href: '/admin/photos',
      icon: PhotoIcon,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Create Category',
      description: 'Organize your photos with categories',
      href: '/admin/categories',
      icon: TagIcon,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'Write Article',
      description: 'Share your photography stories',
      href: '/admin/articles',
      icon: DocumentTextIcon,
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      name: 'View Site',
      description: 'See your live website',
      href: '/',
      icon: EyeIcon,
      color: 'bg-gray-600 hover:bg-gray-700',
      external: true
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back! Here&apos;s what&apos;s happening with your photography portfolio.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link key={card.name} href={card.href}>
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer">
              <div className="flex items-center">
                <div className={`${card.color} rounded-lg p-3`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">{card.name}</p>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                target={action.external ? '_blank' : undefined}
                className={`block p-4 rounded-lg ${action.color} transition-colors`}
              >
                <div className="flex items-center">
                  <action.icon className="w-5 h-5 text-white mr-3" />
                  <div>
                    <h3 className="font-medium text-white">{action.name}</h3>
                    <p className="text-sm text-gray-100 opacity-90">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Photos */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Photos</h2>
            <Link 
              href="/admin/photos"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all
            </Link>
          </div>
          
          {stats.recentPhotos.length > 0 ? (
            <div className="space-y-3">
              {stats.recentPhotos.map((photo) => (
                <div key={photo.id} className="flex items-center space-x-3">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {photo.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(photo.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <PhotoIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No photos uploaded yet</p>
              <Link
                href="/admin/photos"
                className="inline-flex items-center mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Upload your first photo
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 