import Link from 'next/link';
import { nativeDB } from '@/lib/db-native';
import { Image } from '@/components/common/Image';

export const dynamic = 'force-dynamic';

interface Params { slug: string }

export default async function EventDetailPage({ params }: { params: Params }) {
  const event = await nativeDB.findEventBySlug(params.slug);
  if (!event) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Event Not Found</h1>
          <p className="text-gray-400 mb-6">We couldn&apos;t find this event.</p>
          <Link href="/events" className="px-4 py-2 bg-white text-black rounded">Back to Events</Link>
        </div>
      </div>
    );
  }

  // Fetch full event with curated photos ordered by position
  const full = await nativeDB.getEventWithRelations(event.id);
  const photos = (full?.photos ?? []) as Array<{ id: string; title: string; url: string; thumbnail?: string }>;

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="py-16 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="text-sm text-gray-400 mb-4">
            <Link href="/events" className="hover:text-white">Events</Link>
            <span className="mx-2">→</span>
            <span className="text-white">{event.name}</span>
          </nav>
          <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
          {event.description && (
            <p className="text-gray-300 max-w-3xl">{event.description}</p>
          )}
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {photos.map((p) => (
            <div key={p.id} className="relative w-full" style={{ height: '360px' }}>
              <div className="absolute inset-0 rounded overflow-hidden group">
                <Image src={p.thumbnail || p.url} alt={p.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
          {photos.length === 0 && (
            <div className="text-gray-400">No photos curated for this event yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}


