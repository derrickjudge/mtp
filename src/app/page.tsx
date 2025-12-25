import { Image } from '@/components/common/Image';
import Link from 'next/link';
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

export default async function HomePage() {
  // Fetch hero image
  const heroImage = await getPageHeader('home');

  return (
    <div className="bg-black text-white" role="main">
      {/* Full-Screen Hero - Edge to Edge */}
      <section className="relative w-screen h-screen -mt-16">
        {/* Full-bleed background image */}
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="MTP Collective"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        
        {/* Subtle gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        
        {/* Centered quote/tagline */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6 max-w-5xl">
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white mb-6 tracking-wider leading-tight uppercase">
              Every frame tells a story
            </h1>
            <p className="text-lg md:text-xl text-white/80 font-light tracking-widest uppercase">
              Waiting to be discovered
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg 
            className="w-6 h-6 text-white/70" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Minimal Content Section */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xl md:text-2xl text-gray-300 font-light leading-relaxed mb-12">
            MTP Collective captures the raw energy of live music, the intensity of sports, 
            and the authentic moments of street life. We don&apos;t just take photos—we preserve feelings.
          </p>
          <Link
            href="/portfolio"
            className="inline-block px-8 py-4 border border-white/30 text-white font-medium tracking-wider uppercase text-sm hover:bg-white hover:text-black transition-all duration-300"
          >
            View Portfolio
          </Link>
        </div>
      </section>
    </div>
  );
}
