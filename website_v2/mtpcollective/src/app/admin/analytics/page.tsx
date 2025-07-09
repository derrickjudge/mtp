'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  ChartBarIcon, 
  EyeIcon, 
  PhotoIcon, 
  DocumentTextIcon,
  CalendarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  totalViews: number;
  photosViewed: number;
  articlesViewed: number;
  topPhotos: Array<{
    id: string;
    title: string;
    views: number;
    url: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'photo_view' | 'article_view' | 'contact_form';
    description: string;
    timestamp: string;
  }>;
  monthlyStats: Array<{
    month: string;
    views: number;
    photos: number;
    articles: number;
  }>;
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0,
    photosViewed: 0,
    articlesViewed: 0,
    topPhotos: [],
    recentActivity: [],
    monthlyStats: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      if (!response.ok) {
        // If analytics API doesn't exist yet, show mock data
        if (response.status === 404) {
          setAnalytics({
            totalViews: 1247,
            photosViewed: 892,
            articlesViewed: 355,
            topPhotos: [
              { id: '1', title: 'Concert at Madison Square Garden', views: 156, url: '/images/placeholder.jpg' },
              { id: '2', title: 'Vintage Mustang at Sunset', views: 134, url: '/images/placeholder.jpg' },
              { id: '3', title: 'Mountain Landscape', views: 98, url: '/images/placeholder.jpg' },
            ],
            recentActivity: [
              { id: '1', type: 'photo_view', description: 'Photo "Concert Night" was viewed', timestamp: '2024-01-15T10:30:00Z' },
              { id: '2', type: 'contact_form', description: 'New contact form submission', timestamp: '2024-01-15T09:15:00Z' },
              { id: '3', type: 'article_view', description: 'Article "Photography Tips" was viewed', timestamp: '2024-01-15T08:45:00Z' },
            ],
            monthlyStats: [
              { month: 'Dec', views: 1150, photos: 45, articles: 12 },
              { month: 'Jan', views: 1247, photos: 52, articles: 15 },
            ]
          });
          return;
        }
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Analytics API not implemented yet:', err);
      // Set mock data for demonstration
      setAnalytics({
        totalViews: 1247,
        photosViewed: 892,
        articlesViewed: 355,
        topPhotos: [
          { id: '1', title: 'Concert at Madison Square Garden', views: 156, url: '/images/placeholder.jpg' },
          { id: '2', title: 'Vintage Mustang at Sunset', views: 134, url: '/images/placeholder.jpg' },
          { id: '3', title: 'Mountain Landscape', views: 98, url: '/images/placeholder.jpg' },
        ],
        recentActivity: [
          { id: '1', type: 'photo_view', description: 'Photo "Concert Night" was viewed', timestamp: '2024-01-15T10:30:00Z' },
          { id: '2', type: 'contact_form', description: 'New contact form submission', timestamp: '2024-01-15T09:15:00Z' },
          { id: '3', type: 'article_view', description: 'Article "Photography Tips" was viewed', timestamp: '2024-01-15T08:45:00Z' },
        ],
        monthlyStats: [
          { month: 'Dec', views: 1150, photos: 45, articles: 12 },
          { month: 'Jan', views: 1247, photos: 52, articles: 15 },
        ]
      });
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const statCards = [
    {
      name: 'Total Views',
      value: analytics.totalViews.toLocaleString(),
      icon: EyeIcon,
      color: 'bg-blue-500',
      change: '+12.5%'
    },
    {
      name: 'Photo Views',
      value: analytics.photosViewed.toLocaleString(),
      icon: PhotoIcon,
      color: 'bg-green-500',
      change: '+8.3%'
    },
    {
      name: 'Article Views',
      value: analytics.articlesViewed.toLocaleString(),
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      change: '+15.2%'
    },
    {
      name: 'Avg. Monthly',
      value: Math.round(analytics.totalViews / 12).toLocaleString(),
      icon: ArrowTrendingUpIcon,
      color: 'bg-orange-500',
      change: '+6.7%'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'photo_view':
        return PhotoIcon;
      case 'article_view':
        return DocumentTextIcon;
      case 'contact_form':
        return CalendarIcon;
      default:
        return EyeIcon;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'photo_view':
        return 'text-blue-400';
      case 'article_view':
        return 'text-purple-400';
      case 'contact_form':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Track your website performance and engagement</p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-300">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="rounded-md border-gray-600 bg-gray-700 text-white text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.name} className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">{card.name}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-sm text-green-400 mt-1">{card.change}</p>
              </div>
              <div className={`${card.color} rounded-lg p-3`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Photos */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Performing Photos</h2>
          
          {analytics.topPhotos.length > 0 ? (
            <div className="space-y-4">
              {analytics.topPhotos.map((photo, index) => (
                <div key={photo.id} className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-400 w-6">
                    #{index + 1}
                  </div>
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                    <Image
                      src={photo.url}
                      alt={photo.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMiAxNkwyMCAyNEwyOCAxNiIgc3Ryb2tlPSIjNkI3Mjg0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {photo.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {photo.views} views
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <PhotoIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No photo views yet</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          
          {analytics.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {analytics.recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${getActivityColor(activity.type)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Monthly Overview</h2>
        
        {analytics.monthlyStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 py-2">Month</th>
                  <th className="text-left text-gray-400 py-2">Views</th>
                  <th className="text-left text-gray-400 py-2">Photos</th>
                  <th className="text-left text-gray-400 py-2">Articles</th>
                </tr>
              </thead>
              <tbody>
                {analytics.monthlyStats.map((stat) => (
                  <tr key={stat.month} className="border-b border-gray-700/50">
                    <td className="py-3 text-white font-medium">{stat.month}</td>
                    <td className="py-3 text-blue-400">{stat.views.toLocaleString()}</td>
                    <td className="py-3 text-green-400">{stat.photos}</td>
                    <td className="py-3 text-purple-400">{stat.articles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <ChartBarIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No monthly data available</p>
          </div>
        )}
      </div>

      {/* Note about implementation */}
      <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
        <div className="flex items-center">
          <ChartBarIcon className="w-5 h-5 text-yellow-400 mr-2" />
          <p className="text-sm text-yellow-200">
            <strong>Note:</strong> This is a preview of the analytics dashboard. 
            Real analytics will be implemented when the analytics API is created.
          </p>
        </div>
      </div>
    </div>
  );
} 