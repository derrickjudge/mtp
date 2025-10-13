'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CalendarDaysIcon, PlusIcon, PencilIcon, TrashIcon, PhotoIcon, TagIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
  date?: string;
  location?: string;
  coverImage?: string;
  published: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  categories?: Category[];
  photos?: Photo[];
  articles?: Article[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Photo {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
}

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [showArticleSelector, setShowArticleSelector] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    coverImage: '',
    published: false,
    featured: false,
    categoryIds: [] as string[],
    photoIds: [] as string[],
    articleIds: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, categoriesRes, photosRes, articlesRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/categories'),
        fetch('/api/photos?take=50'),
        fetch('/api/articles?take=50')
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (photosRes.ok) {
        const photosData = await photosRes.json();
        setPhotos(photosData.photos || []);
      }

      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();
        setArticles(articlesData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Event name is required');
      return;
    }

    setIsCreating(true);

    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save event');
      }

      const event = await response.json();
      
      if (editingEvent) {
        setEvents(prev => prev.map(evt => evt.id === event.id ? event : evt));
        toast.success('Event updated successfully');
        setEditingEvent(null);
      } else {
        setEvents(prev => [...prev, event]);
        toast.success('Event created successfully');
      }

      setFormData({ 
        name: '', 
        description: '', 
        date: '', 
        location: '', 
        coverImage: '',
        published: false, 
        featured: false,
        categoryIds: [],
        photoIds: [],
        articleIds: []
      });
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description || '',
      date: event.date ? event.date.split('T')[0] : '',
      location: event.location || '',
      coverImage: event.coverImage || '',
      published: event.published,
      featured: event.featured,
      categoryIds: event.categories?.map(c => c.id) || [],
      photoIds: event.photos?.map(p => p.id) || [],
      articleIds: event.articles?.map(a => a.id) || [],
    });
    setShowForm(true);
  };

  const movePhoto = (index: number, direction: -1 | 1) => {
    setFormData(prev => {
      const next = [...prev.photoIds];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[newIndex];
      next[newIndex] = temp;
      return { ...prev, photoIds: next };
    });
  };

  const [topPhotoIds, setTopPhotoIds] = useState<string[]>([]);

  const toggleTop = (photoId: string) => {
    setTopPhotoIds(prev => prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]);
  };

  const saveCuration = async () => {
    if (!editingEvent) return;
    try {
      const res = await fetch(`/api/events/${editingEvent.id}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedPhotoIds: formData.photoIds, topPhotoIds }),
      });
      if (!res.ok) throw new Error('Failed to save ordering');
      toast.success('Event photo ordering saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save ordering');
    }
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`Are you sure you want to delete "${event.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete event');
      }

      setEvents(prev => prev.filter(evt => evt.id !== event.id));
      toast.success('Event deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const handleCancel = () => {
    setEditingEvent(null);
    setFormData({ 
      name: '', 
      description: '', 
      date: '', 
      location: '', 
      coverImage: '',
      published: false, 
      featured: false,
      categoryIds: [],
      photoIds: [],
      articleIds: []
    });
    setShowForm(false);
  };

  const togglePublished = async (event: Event) => {
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...event, 
          published: !event.published,
          categoryIds: event.categories?.map(c => c.id) || [],
          photoIds: event.photos?.map(p => p.id) || [],
          articleIds: event.articles?.map(a => a.id) || [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      const updatedEvent = await response.json();
      setEvents(prev => prev.map(evt => evt.id === event.id ? updatedEvent : evt));
      toast.success(`Event ${updatedEvent.published ? 'published' : 'unpublished'}`);
    } catch (err) {
      toast.error('Failed to update event status');
    }
  };

  const handlePhotoSelect = (photo: Photo) => {
    setFormData(prev => ({
      ...prev,
      photoIds: prev.photoIds.includes(photo.id)
        ? prev.photoIds.filter(id => id !== photo.id)
        : [...prev.photoIds, photo.id]
    }));
  };

  const handleArticleSelect = (article: Article) => {
    setFormData(prev => ({
      ...prev,
      articleIds: prev.articleIds.includes(article.id)
        ? prev.articleIds.filter(id => id !== article.id)
        : [...prev.articleIds, article.id]
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  const selectedPhotos = photos.filter(p => formData.photoIds.includes(p.id));
  const selectedArticles = articles.filter(a => formData.articleIds.includes(a.id));

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
          <h1 className="text-2xl font-bold text-white">Event Management</h1>
          <p className="text-gray-400 mt-1">Manage photography events, shows, and exhibitions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Event
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Event Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </h2>
          {editingEvent && (
            <div className="mb-4 text-xs text-gray-400">Event ID: {editingEvent.id}</div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter event name"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Brief description of the event"
              />
            </div>

            {/* Date and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-200 mb-2">
                  Event Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-200 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Event location"
                />
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Cover Image
              </label>
              <div className="flex items-center space-x-4">
                {formData.coverImage && (
                  <div className="relative w-32 h-20 rounded-md overflow-hidden">
                    <Image
                      src={formData.coverImage}
                      alt="Cover image"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPhotoSelector(true)}
                    className="inline-flex items-center px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                  >
                    <PhotoIcon className="w-4 h-4 mr-2" />
                    Select Photo
                  </button>
                  {formData.coverImage && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                      className="px-3 py-2 text-red-300 bg-red-600/20 rounded-md hover:bg-red-600/30"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Categories
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Photos ({selectedPhotos.length})
              </label>
              <div className="flex items-center space-x-4">
                {selectedPhotos.length > 0 && (
                  <div className="w-full">
                    <div className="space-y-2">
                      {formData.photoIds.map((id, idx) => {
                        const ph = photos.find(p => p.id === id);
                        if (!ph) return null;
                        const isTop = topPhotoIds.includes(id);
                        return (
                          <div key={id} className="flex items-center gap-3 bg-gray-700 rounded p-2">
                            <div className="relative w-12 h-12 rounded overflow-hidden">
                              <Image src={ph.thumbnail || ph.url} alt={ph.title} fill className="object-cover" />
                            </div>
                            <div className="flex-1 text-sm text-gray-200 truncate">{ph.title}</div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => movePhoto(idx, -1)} className="px-2 py-1 text-xs bg-gray-600 rounded text-white">Up</button>
                              <button type="button" onClick={() => movePhoto(idx, 1)} className="px-2 py-1 text-xs bg-gray-600 rounded text-white">Down</button>
                              <label className="flex items-center gap-1 text-xs text-gray-200">
                                <input type="checkbox" checked={isTop} onChange={() => toggleTop(id)} className="rounded" />
                                Top
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={saveCuration} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Ordering</button>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowPhotoSelector(true)}
                  className="inline-flex items-center px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                >
                  <PhotoIcon className="w-4 h-4 mr-2" />
                  {selectedPhotos.length > 0 ? 'Manage Photos' : 'Select Photos'}
                </button>
              </div>
            </div>

            {/* Articles */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Articles ({selectedArticles.length})
              </label>
              <div className="flex items-center space-x-4">
                {selectedArticles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedArticles.map((article) => (
                      <span key={article.id} className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm">
                        {article.title}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowArticleSelector(true)}
                  className="inline-flex items-center px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                >
                  <TagIcon className="w-4 h-4 mr-2" />
                  {selectedArticles.length > 0 ? 'Manage Articles' : 'Select Articles'}
                </button>
              </div>
            </div>

            {/* Publishing Options */}
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-200">Publish immediately</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-200">Featured event</span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isCreating ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Photo Selector Modal */}
      {showPhotoSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Select Photos</h3>
              <button
                onClick={() => setShowPhotoSelector(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    formData.photoIds.includes(photo.id) ? 'border-blue-500 ring-2 ring-blue-500' : 'border-transparent hover:border-gray-500'
                  }`}
                  onClick={() => handlePhotoSelect(photo)}
                >
                  <Image
                    src={photo.thumbnail || photo.url}
                    alt={photo.title}
                    fill
                    className="object-cover"
                  />
                  {formData.photoIds.includes(photo.id) && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      ✓
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs truncate">
                    {photo.title}
                  </div>
                </div>
              ))}
            </div>
            {photos.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No photos available. Upload some photos first.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Article Selector Modal */}
      {showArticleSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Select Articles</h3>
              <button
                onClick={() => setShowArticleSelector(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                    formData.articleIds.includes(article.id) ? 'border-blue-500 bg-blue-600/20' : 'border-gray-700 bg-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => handleArticleSelect(article)}
                >
                  <div className="flex items-start space-x-4">
                    {article.coverImage && (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden">
                        <Image
                          src={article.coverImage}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{article.title}</h4>
                      {article.excerpt && (
                        <p className="text-gray-300 text-sm mt-1">{article.excerpt}</p>
                      )}
                    </div>
                    {formData.articleIds.includes(article.id) && (
                      <div className="text-blue-400">
                        ✓ Selected
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {articles.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No articles available. Create some articles first.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">Your Events</h2>
        
        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-white">{event.name}</h3>
                      <div className="flex gap-1">
                        <span className={`px-2 py-1 text-xs rounded ${
                          event.published 
                            ? 'bg-green-600/20 text-green-300' 
                            : 'bg-yellow-600/20 text-yellow-300'
                        }`}>
                          {event.published ? 'Published' : 'Draft'}
                        </span>
                        {event.featured && (
                          <span className="px-2 py-1 text-xs rounded bg-purple-600/20 text-purple-300">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-300 mb-2">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      {event.date && (
                        <div className="flex items-center gap-1">
                          <CalendarDaysIcon className="w-4 h-4" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                      {event.photos && event.photos.length > 0 && (
                        <div className="flex items-center gap-1">
                          <PhotoIcon className="w-4 h-4" />
                          {event.photos.length} photos
                        </div>
                      )}
                      {event.articles && event.articles.length > 0 && (
                        <div className="flex items-center gap-1">
                          <TagIcon className="w-4 h-4" />
                          {event.articles.length} articles
                        </div>
                      )}
                    </div>
                    {event.categories && event.categories.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {event.categories.map((category) => (
                          <span key={category.id} className="text-xs text-blue-300 bg-blue-600/20 px-2 py-1 rounded">
                            {category.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => togglePublished(event)}
                      className={`px-3 py-1 text-sm rounded ${
                        event.published
                          ? 'text-yellow-300 bg-yellow-600/20 hover:bg-yellow-600/30'
                          : 'text-green-300 bg-green-600/20 hover:bg-green-600/30'
                      }`}
                    >
                      {event.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleEdit(event)}
                      className="px-3 py-1 text-sm text-blue-300 bg-blue-600/20 rounded hover:bg-blue-600/30"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(event)}
                      className="px-3 py-1 text-sm text-red-300 bg-red-600/20 rounded hover:bg-red-600/30"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CalendarDaysIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-2">No events yet</div>
            <p className="text-gray-500 mb-4">Start organizing your photography events and shows</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Your First Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 