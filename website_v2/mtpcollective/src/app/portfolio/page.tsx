import { SectionHeader } from '@/components/common/SectionHeader';
import { GalleryGrid } from '@/components/common/GalleryGrid';
import { Image } from '@/components/common/Image';
import { imageUrls } from '@/utils/imageUrls';
import { photoService, PhotoWithRelations } from '@/services/photoService';
import { Photo } from '@/types/photo';
import { Prisma } from '@prisma/client';

export const revalidate = 3600; // Revalidate every hour

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
    concertPhotos = concertPhotosWithRelations.map(photo => ({
      id: photo.id,
      title: photo.title,
      description: photo.description || undefined,
      url: photo.url,
      thumbnail: photo.thumbnail || undefined,
      published: photo.published,
      featured: photo.featured,
      metadata: photo.metadata ? (photo.metadata as Record<string, any>) : undefined,
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
      authorId: photo.authorId,
      categories: photo.categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || undefined,
      })),
      tags: photo.tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
    }));

    automotivePhotos = automotivePhotosWithRelations.map(photo => ({
      id: photo.id,
      title: photo.title,
      description: photo.description || undefined,
      url: photo.url,
      thumbnail: photo.thumbnail || undefined,
      published: photo.published,
      featured: photo.featured,
      metadata: photo.metadata ? (photo.metadata as Record<string, any>) : undefined,
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
      authorId: photo.authorId,
      categories: photo.categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || undefined,
      })),
      tags: photo.tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
    }));

    naturePhotos = naturePhotosWithRelations.map(photo => ({
      id: photo.id,
      title: photo.title,
      description: photo.description || undefined,
      url: photo.url,
      thumbnail: photo.thumbnail || undefined,
      published: photo.published,
      featured: photo.featured,
      metadata: photo.metadata ? (photo.metadata as Record<string, any>) : undefined,
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
      authorId: photo.authorId,
      categories: photo.categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || undefined,
      })),
      tags: photo.tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
    }));
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