import { Image } from '@/components/common/Image';
import Link from 'next/link';
import type { Photo } from '@/types/photo';
import { nativeDB } from '@/lib/db-native';
import { getPageHeader } from '@/utils/pageHeaders';
import type { Metadata } from 'next';

// Make this page dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Sports, Music & Street Photography',
  description: 'MTP Collective captures the energy of live sports, the rhythm of music, and the authenticity of street life. Professional photography portfolio showcasing concerts, athletics, and urban moments.',
  keywords: ['sports photography', 'concert photography', 'street photography', 'music photography', 'event photography', 'MTP Collective', 'professional photographer'],
  openGraph: {
    title: 'MTP Collective | Sports, Music & Street Photography',
    description: 'Capturing the energy of live sports, the rhythm of music, and the authenticity of street life.',
  },
};

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

async function fetchFeaturedPhotos(): Promise<Photo[]> {
  try {
    const photos = await nativeDB.findPhotos({
      featured: true,
      published: true,
      take: 6,
    });
    return photos;
  } catch (error) {
    console.error('Error fetching featured photos:', error);
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

async function fetchPhotosByCategory(categoryId: string, take: number = 1): Promise<Photo[]> {
  try {
    const photos = await nativeDB.findPhotos({
      categoryId,
      published: true,
      take,
    });
    return photos;
  } catch (error) {
    console.error('Error fetching photos for category:', categoryId, error);
    return [];
  }
}

export default async function HomePage() {
  // Fetch featured photos, categories, and hero image
  const [featuredPhotos, categories, heroImage] = await Promise.all([
    fetchFeaturedPhotos(),
    fetchCategories(),
    getPageHeader('home'),
  ]);

  // Fetch one photo per category for specialties section
  const categoriesWithPhotos = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      photos: await fetchPhotosByCategory(category.id, 1),
    }))
  );

  const specialtiesWithPhotos = categoriesWithPhotos.filter(category => category.photos.length > 0);

  return (
    <div className="min-h-screen bg-black text-white" role="main">
      {/* Hero Section */}
      <section className="relative w-full" style={{ height: '80vh' }}>
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="MTP Collective Hero"
            fill
            priority
            sizes="100vw"
            className="brightness-75"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              MTP Collective
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 font-light">
              Capturing moments through a unique lens
            </p>
          </div>
        </div>
      </section>

      {/* Featured Photos */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto pl-0 pr-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            Featured Photos
          </h2>
          {featuredPhotos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredPhotos.slice(0, 6).map((photo) => (
                <div key={photo.id} className="relative w-full" style={{ height: '400px' }}>
                  <div className="absolute inset-0 group overflow-hidden rounded-lg">
                    <Image
                      src={photo.thumbnail || photo.url}
                      alt={photo.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="text-white font-semibold text-lg">{photo.title}</h3>
                      {photo.description && (
                        <p className="text-gray-300 text-sm mt-1">{photo.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📸</div>
              <p className="text-gray-400 text-lg">
                Featured photos coming soon! Check back for our latest work.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Specialties */}
      <section className="py-24 bg-zinc-900">
        <div className="max-w-7xl mx-auto pl-0 pr-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            Our Specialties
          </h2>
          {specialtiesWithPhotos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {specialtiesWithPhotos.map((category) => (
                <Link key={category.id} href="/portfolio" className="block">
                  <div className="relative w-full" style={{ height: '400px' }}>
                    <div className="absolute inset-0 group overflow-hidden rounded-lg cursor-pointer">
                      <Image
                        src={category.photos[0].thumbnail || category.photos[0].url}
                        alt={`${category.name} photography`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-center p-8">
                        <h3 className="text-2xl font-bold text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-gray-400 text-lg">
                Our photography specialties are being curated. Visit our portfolio to see our work!
              </p>
              <Link
                href="/portfolio"
                className="inline-block mt-4 px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                View Portfolio
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto pl-0 pr-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            About MTP Collective
          </h2>
          <div className="text-gray-300 text-lg space-y-6">
            <p className="leading-relaxed">
              We are a collective of passionate photographers dedicated to capturing
              the essence of life through our lenses. From the energy of live
              concerts to the beauty of nature and the power of automotive design,
              we bring our unique perspective to every shot.
            </p>
            <p className="leading-relaxed">
              Our mission is to create timeless images that tell stories and evoke
              emotions, preserving moments that would otherwise be lost to time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
