import { SectionHeader } from '@/components/common/SectionHeader';
import { GalleryGrid } from '@/components/common/GalleryGrid';
import { Image } from '@/components/common/Image';
import { imageUrls } from '@/utils/imageUrls';
import { placeholderImages } from '@/utils/placeholderImages';

// Temporary portfolio data - will be replaced with database data
const portfolioData = {
  concert: [
    {
      src: placeholderImages.concertPhoto1,
      alt: 'Concert photography 1',
      title: 'Live Performance',
      description: 'Capturing the energy of live music',
    },
    {
      src: placeholderImages.concertPhoto2,
      alt: 'Concert photography 2',
      title: 'Stage Presence',
      description: 'The magic of live performances',
    },
    {
      src: placeholderImages.concertPhoto3,
      alt: 'Concert photography 3',
      title: 'Crowd Energy',
      description: 'The connection between artist and audience',
    },
  ],
  automotive: [
    {
      src: placeholderImages.autoPhoto1,
      alt: 'Automotive photography 1',
      title: 'Classic Beauty',
      description: 'Timeless automotive design',
    },
    {
      src: placeholderImages.autoPhoto2,
      alt: 'Automotive photography 2',
      title: 'Modern Lines',
      description: 'Contemporary automotive art',
    },
    {
      src: placeholderImages.autoPhoto3,
      alt: 'Automotive photography 3',
      title: 'Speed and Grace',
      description: 'The perfect blend of power and elegance',
    },
  ],
  nature: [
    {
      src: placeholderImages.naturePhoto1,
      alt: 'Nature photography 1',
      title: 'Mountain Majesty',
      description: 'The grandeur of nature',
    },
    {
      src: placeholderImages.naturePhoto2,
      alt: 'Nature photography 2',
      title: 'Forest Serenity',
      description: 'Peace and tranquility in nature',
    },
    {
      src: placeholderImages.naturePhoto3,
      alt: 'Nature photography 3',
      title: 'Ocean Wonders',
      description: 'The beauty of coastal landscapes',
    },
  ],
};

export default function PortfolioPage() {
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
          <GalleryGrid photos={portfolioData.concert} />
        </div>
      </section>

      {/* Automotive Photography */}
      <section className="py-24 px-4 md:px-8 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Automotive Photography"
            subtitle="Showcasing the beauty and power of automotive design"
          />
          <GalleryGrid photos={portfolioData.automotive} />
        </div>
      </section>

      {/* Nature Photography */}
      <section className="py-24 px-4 md:px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Nature Photography"
            subtitle="Exploring the beauty and wonder of the natural world"
          />
          <GalleryGrid photos={portfolioData.nature} />
        </div>
      </section>
    </div>
  );
} 