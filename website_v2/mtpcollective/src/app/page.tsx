import Image from '@/components/common/Image';
import { imageUrls } from '@/utils/imageUrls';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white" role="main">
      {/* Hero Section */}
      <section className="relative w-full" style={{ height: '80vh' }}>
        <div className="absolute inset-0">
          <Image
            src={imageUrls.hero}
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
      <section className="py-24 px-4 md:px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            Featured Photos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(imageUrls.featured).map(([key, url]) => (
              <div key={key} className="relative w-full" style={{ height: '400px' }}>
                <div className="absolute inset-0 group overflow-hidden rounded-lg">
                  <Image
                    src={url}
                    alt={`Featured photo ${key}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="py-24 px-4 md:px-8 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            Our Specialties
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(imageUrls.specialties).map(([key, url]) => (
              <div key={key} className="relative w-full" style={{ height: '400px' }}>
                <div className="absolute inset-0 group overflow-hidden rounded-lg">
                  <Image
                    src={url}
                    alt={`${key} photography`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-center p-8">
                    <h3 className="text-2xl font-bold text-white capitalize transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      {key}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-4 md:px-8 bg-black">
        <div className="max-w-4xl mx-auto">
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
