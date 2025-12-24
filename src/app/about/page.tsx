import { SectionHeader } from '@/components/common/SectionHeader';
import { PhotoCard } from '@/components/common/PhotoCard';
import { Image } from '@/components/common/Image';
import { imageUrls } from '@/utils/imageUrls';
import { getPageHeader } from '@/utils/pageHeaders';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Meet the passionate photographers behind MTP Collective. We specialize in capturing the energy of sports, music, and street life through our unique lens.',
  openGraph: {
    title: 'About Us | MTP Collective',
    description: 'Meet the passionate photographers behind MTP Collective.',
  },
};

export default async function AboutPage() {
  const heroImage = await getPageHeader('about');
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative w-full" style={{ height: '60vh' }}>
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="About MTP Collective"
            fill
            priority
            sizes="100vw"
            className="brightness-75"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              About Us
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 font-light">
              Our story and mission
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto pl-0 sm:pl-1 pr-4">
          <SectionHeader
            title="Our Story"
            subtitle="From passion to profession, we've been capturing moments that matter since 2023."
          />
          <div className="text-gray-300 text-lg space-y-6">
            <p className="leading-relaxed">
              MTP Collective was born from a shared passion for photography and a
              desire to capture the world through our unique perspectives. What
              started as a group of friends documenting local events has grown
              into a collective of professional photographers dedicated to
              excellence in our craft.
            </p>
            <p className="leading-relaxed">
              Our journey began in 2015 when we first came together to cover a
              local music festival. The energy of the event, the raw emotions of
              the performers, and the connection with the audience inspired us to
              create something special. We realized that our combined talents and
              different perspectives could create something greater than the sum
              of its parts.
            </p>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-24 bg-zinc-900">
        <div className="max-w-7xl mx-auto pl-0 sm:pl-1 pr-4">
          <SectionHeader
            title="Our Mission"
            subtitle="To capture and preserve moments that tell stories and evoke emotions."
          />
          <div className="text-gray-300 text-lg space-y-6">
            <p className="leading-relaxed">
              At MTP Collective, we believe that every moment has a story to tell.
              Our mission is to capture these stories through our lenses, creating
              images that not only document events but also convey the emotions
              and atmosphere that make them special.
            </p>
            <p className="leading-relaxed">
              We specialize in three main areas: concert photography, automotive
              photography, and nature photography. Each of these areas presents
              unique challenges and opportunities to capture moments that would
              otherwise be lost to time.
            </p>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto pl-0 sm:pl-1 pr-4">
          <SectionHeader
            title="Our Team"
            subtitle="Meet the photographers behind MTP Collective"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(imageUrls.team).map(([key, url]) => (
              <div key={key} className="text-center">
                <PhotoCard
                  src={url}
                  alt={`Team member ${key}`}
                  aspectRatio="portrait"
                  className="mb-4"
                />
                <h3 className="text-xl font-bold text-white mb-2 capitalize">
                  {key.replace('photographer', 'Photographer ')}
                </h3>
                <p className="text-gray-300">
                  Specializing in {key.toLowerCase().replace('photographer', '')} photography
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 