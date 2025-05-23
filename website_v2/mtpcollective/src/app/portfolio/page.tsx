import { SectionHeader } from '@/components/common/SectionHeader';
import { Image } from '@/components/common/Image';
import { imageUrls } from '@/utils/imageUrls';
import { photoService, PhotoWithRelations } from '@/services/photoService';
import { PhotoGallery } from '@/components/photos/PhotoGallery';
import type { Photo, Category, Tag } from '@/types/photo';

// Make this page dynamic to prevent Prisma initialization during build
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable static generation

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
    // Continue with empty arrays - the page will render without photos
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative w-full" style={{ height: '40vh' }}>
        <div className="absolute inset-0">
          <Image
            src={imageUrls.portfolio}
            alt="MTP Collective Portfolio"
            fill
            priority
            sizes="100vw"
            className="brightness-75"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Portfolio
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 font-light">
              Explore our photography collections
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
          />
          <PhotoGallery photos={concertPhotos} />
        </div>
      </section>

      {/* Automotive Photography */}
      <section className="py-24 px-4 md:px-8 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Automotive Photography"
            subtitle="Showcasing the beauty and power of automotive design"
          />
          <PhotoGallery photos={automotivePhotos} />
        </div>
      </section>

      {/* Nature Photography */}
      <section className="py-24 px-4 md:px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Nature Photography"
            subtitle="Exploring the beauty and wonder of the natural world"
          />
          <PhotoGallery photos={naturePhotos} />
        </div>
      </section>
    </div>
  );
} 