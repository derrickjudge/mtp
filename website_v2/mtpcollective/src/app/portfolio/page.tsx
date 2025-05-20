import { SectionHeader } from '@/components/common/SectionHeader';
import { GalleryGrid } from '@/components/common/GalleryGrid';
import { Image } from '@/components/common/Image';
import { imageUrls } from '@/utils/imageUrls';
import { photoService } from '@/services/photoService';

export const revalidate = 3600; // Revalidate every hour

export default async function PortfolioPage() {
  // Fetch photos for each category
  const [concertPhotos, automotivePhotos, naturePhotos] = await Promise.all([
    photoService.getPhotos({ categoryId: 'concert' }),
    photoService.getPhotos({ categoryId: 'automotive' }),
    photoService.getPhotos({ categoryId: 'nature' }),
  ]);

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
          <GalleryGrid photos={concertPhotos} />
        </div>
      </section>

      {/* Automotive Photography */}
      <section className="py-24 px-4 md:px-8 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Automotive Photography"
            subtitle="Showcasing the beauty and power of automotive design"
          />
          <GalleryGrid photos={automotivePhotos} />
        </div>
      </section>

      {/* Nature Photography */}
      <section className="py-24 px-4 md:px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Nature Photography"
            subtitle="Exploring the beauty and wonder of the natural world"
          />
          <GalleryGrid photos={naturePhotos} />
        </div>
      </section>
    </div>
  );
} 