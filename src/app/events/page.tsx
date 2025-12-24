import React from 'react';
import { nativeDB } from '@/lib/db-native';
import { CalendarIcon, MapPinIcon, PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Browse our photography events, workshops, and exhibitions. Curated photo collections from sports games, concerts, and street photography sessions.',
  openGraph: {
    title: 'Events | MTP Collective',
    description: 'Browse our photography events, workshops, and exhibitions.',
  },
};

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
  photoCount?: number;
  articleCount?: number;
  categories?: Category[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

async function fetchEvents(): Promise<Event[]> {
  try {
    const events = await nativeDB.findEvents({
      published: true,
    });
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const categories = await nativeDB.findCategories();
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function EventsPage() {
  const [events, categories] = await Promise.all([
    fetchEvents(),
    fetchCategories(),
  ]);

  const featuredEvents = events.filter(event => event.featured);
  const regularEvents = events.filter(event => !event.featured);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20" />
        <div className="relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Events
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto pl-0 sm:pl-1 pr-4">
            Capturing moments and stories from photography events, workshops, and exhibitions
          </p>
        </div>
      </div>

      <div className="max-w-7xl ml-0 sm:ml-1 mr-auto pr-4 py-12">
        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Featured Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} featured={true} />
              ))}
            </div>
          </section>
        )}

        {/* All Events */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">
            {featuredEvents.length > 0 ? 'All Events' : 'Recent Events'}
          </h2>
          
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularEvents.map((event) => (
                <EventCard key={event.id} event={event} featured={false} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-400 mb-2">No Events Yet</h3>
              <p className="text-gray-500">
                Stay tuned for upcoming photography events and exhibitions.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Event Card Component
function EventCard({ event, featured }: { event: Event; featured: boolean }) {
  const eventDate = event.date ? new Date(event.date) : null;

  return (
    <div className={`group bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-all duration-300 ${
      featured ? 'ring-2 ring-purple-500' : ''
    }`}>
      {/* Event Image */}
      {event.coverImage && (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={event.coverImage}
            alt={event.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {featured && (
            <div className="absolute top-4 left-4">
              <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Featured
              </span>
            </div>
          )}
        </div>
      )}

      {/* Event Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">
          <Link href={`/events/${event.slug}`}>{event.name}</Link>
        </h3>
        
        {event.description && (
          <p className="text-gray-400 mb-4 line-clamp-3">{event.description}</p>
        )}

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          {eventDate && (
            <div className="flex items-center text-sm text-gray-400">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {eventDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
          
          {event.location && (
            <div className="flex items-center text-sm text-gray-400">
              <MapPinIcon className="w-4 h-4 mr-2" />
              {event.location}
            </div>
          )}
        </div>

        {/* Categories */}
        {event.categories && event.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.categories.map((category) => (
              <span
                key={category.id}
                className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}

        {/* Content Counts */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {event.photoCount !== undefined && (
              <div className="flex items-center">
                <PhotoIcon className="w-4 h-4 mr-1" />
                {event.photoCount} photos
              </div>
            )}
            {event.articleCount !== undefined && (
              <div className="flex items-center">
                <DocumentTextIcon className="w-4 h-4 mr-1" />
                {event.articleCount} articles
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

