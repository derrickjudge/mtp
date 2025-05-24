import { SectionHeader } from '@/components/common/SectionHeader';
import { Image } from '@/components/common/Image';
import { imageUrls } from '@/utils/imageUrls';
import { photoService, PhotoWithRelations } from '@/services/photoService';
import { PhotoGallery } from '@/components/photos/PhotoGallery';
import type { Photo, Category, Tag } from '@/types/photo';

// Make this page dynamic to prevent Prisma initialization during build
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable static generation

// Sample photos for development
const samplePhotos = {
  concert: [
    {
      id: 'concert-1',
      title: 'Rock Concert 2024',
      description: 'Capturing the energy of live music',
      url: '/images/portfolio/concert-1.jpg',
      thumbnail: '/images/portfolio/concert-1.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: true,
      featured: false,
      authorId: 'sample-author',
      categories: [{ id: 'concert', name: 'Concert', slug: 'concert' }],
      tags: [{ id: 'music', name: 'Music', slug: 'music' }, { id: 'live', name: 'Live', slug: 'live' }],
    },
    {
      id: 'concert-2',
      title: 'Jazz Night',
      description: 'Intimate jazz performance',
      url: '/images/portfolio/concert-2.jpg',
      thumbnail: '/images/portfolio/concert-2.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: true,
      featured: false,
      authorId: 'sample-author',
      categories: [{ id: 'concert', name: 'Concert', slug: 'concert' }],
      tags: [{ id: 'jazz', name: 'Jazz', slug: 'jazz' }, { id: 'night', name: 'Night', slug: 'night' }],
    },
    {
      id: 'concert-3',
      title: 'Summer Festival',
      description: 'Outdoor music festival',
      url: '/images/portfolio/concert-3.jpg',
      thumbnail: '/images/portfolio/concert-3.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: true,
      featured: false,
      authorId: 'sample-author',
      categories: [{ id: 'concert', name: 'Concert', slug: 'concert' }],
      tags: [{ id: 'festival', name: 'Festival', slug: 'festival' }, { id: 'summer', name: 'Summer', slug: 'summer' }],
    },
  ],
  automotive: [
    {
      id: 'auto-1',
      title: 'Classic Car Show',
      description: 'Vintage automobiles on display',
      url: '/images/portfolio/auto-1.jpg',
      thumbnail: '/images/portfolio/auto-1.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: true,
      featured: false,
      authorId: 'sample-author',
      categories: [{ id: 'automotive', name: 'Automotive', slug: 'automotive' }],
      tags: [{ id: 'classic', name: 'Classic', slug: 'classic' }, { id: 'vintage', name: 'Vintage', slug: 'vintage' }],
    },
    {
      id: 'auto-2',
      title: 'Sports Car',
      description: 'Modern sports car photography',
      url: '/images/portfolio/auto-2.jpg',
      thumbnail: '/images/portfolio/auto-2.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: true,
      featured: false,
      authorId: 'sample-author',
      categories: [{ id: 'automotive', name: 'Automotive', slug: 'automotive' }],
      tags: [{ id: 'sports', name: 'Sports', slug: 'sports' }, { id: 'modern', name: 'Modern', slug: 'modern' }],
    },
    {
      id: 'auto-3',
      title: 'Car Meet',
      description: 'Local car enthusiast gathering',
      url: '/images/portfolio/auto-3.jpg',
      thumbnail: '/images/portfolio/auto-3.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: true,
      featured: false,
      authorId: 'sample-author',
      categories: [{ id: 'automotive', name: 'Automotive', slug: 'automotive' }],
      tags: [{ id: 'meet', name: 'Meet', slug: 'meet' }, { id: 'local', name: 'Local', slug: 'local' }],
    },
  ],
  nature: [
    {
      id: 'nature-1',
      title: 'Mountain Sunrise',
      description: 'Early morning mountain view',
      url: '/images/portfolio/nature-1.jpg',
      thumbnail: '/images/portfolio/nature-1.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: true,
      featured: false,
      authorId: 'sample-author',
      categories: [{ id: 'nature', name: 'Nature', slug: 'nature' }],
      tags: [{ id: 'mountains', name: 'Mountains', slug: 'mountains' }, { id: 'sunrise', name: 'Sunrise', slug: 'sunrise' }],
    },
    {
      id: 'nature-2',
      title: 'Forest Path',
      description: 'Serene forest trail',
      url: '/images/portfolio/nature-2.jpg',
      thumbnail: '/images/portfolio/nature-2.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: true,
      featured: false,
      authorId: 'sample-author',
      categories: [{ id: 'nature', name: 'Nature', slug: 'nature' }],
      tags: [{ id: 'forest', name: 'Forest', slug: 'forest' }, { id: 'trail', name: 'Trail', slug: 'trail' }],
    },
    {
      id: 'nature-3',
      title: 'Ocean Sunset',
      description: 'Beautiful coastal sunset',
      url: '/images/portfolio/nature-3.jpg',
      thumbnail: '/images/portfolio/nature-3.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: true,
      featured: false,
      authorId: 'sample-author',
      categories: [{ id: 'nature', name: 'Nature', slug: 'nature' }],
      tags: [{ id: 'ocean', name: 'Ocean', slug: 'ocean' }, { id: 'sunset', name: 'Sunset', slug: 'sunset' }],
    },
  ],
};

export default async function PortfolioPage() {
  let concertPhotos: Photo[] = [];
  let automotivePhotos: Photo[] = [];
  let naturePhotos: Photo[] = [];

  try {
    // Fetch photos for each category
    const [concertPhotosWithRelations, automotivePhotosWithRelations, naturePhotosWithRelations] = await Promise.all([
      photoService.getPhotos({ categoryId: 'concert' }),
      photoService.getPhotos({ categoryId: 'automotive' }),
      photoService.getPhotos({ categoryId: 'nature' }),
    ]) as [PhotoWithRelations[], PhotoWithRelations[], PhotoWithRelations[]];

    // Map to Photo[] type
    concertPhotos = concertPhotosWithRelations;
    automotivePhotos = automotivePhotosWithRelations;
    naturePhotos = naturePhotosWithRelations;
  } catch (error) {
    console.error('Error fetching photos:', error);
    // Use sample photos if fetch fails
    concertPhotos = samplePhotos.concert;
    automotivePhotos = samplePhotos.automotive;
    naturePhotos = samplePhotos.nature;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative w-full" style={{ height: '50vh' }}>
        <div className="absolute inset-0">
          <Image
            src={imageUrls.portfolio}
            alt="MTP Collective Portfolio"
            fill
            priority
            sizes="100vw"
            className="object-cover brightness-75"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30 flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Portfolio
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 font-light max-w-2xl mx-auto">
              Explore our photography collections showcasing the art of capturing moments in concerts, automotive events, and nature.
            </p>
          </div>
        </div>
      </section>

      {/* Concert Photography */}
      <section className="py-24 px-4 md:px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Concert Photography"
            subtitle="Capturing the energy and emotion of live performances"
            className="mb-12"
          />
          <PhotoGallery photos={concertPhotos} columns={3} gap="lg" />
        </div>
      </section>

      {/* Automotive Photography */}
      <section className="py-24 px-4 md:px-8 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Automotive Photography"
            subtitle="Showcasing the beauty and power of automotive design"
            className="mb-12"
          />
          <PhotoGallery photos={automotivePhotos} columns={3} gap="lg" />
        </div>
      </section>

      {/* Nature Photography */}
      <section className="py-24 px-4 md:px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Nature Photography"
            subtitle="Exploring the beauty and wonder of the natural world"
            className="mb-12"
          />
          <PhotoGallery photos={naturePhotos} columns={3} gap="lg" />
        </div>
      </section>
    </div>
  );
} 