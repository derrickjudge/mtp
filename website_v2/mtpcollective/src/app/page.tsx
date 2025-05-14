import Image from '@/components/common/Image';
import { imageUrls } from '@/utils/imageUrls';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full">
        <div className="absolute inset-0">
          <Image
            src={imageUrls.hero}
            alt="MTP Collective Hero"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center">
            MTP Collective
          </h1>
        </div>
      </section>

      {/* Featured Photos */}
      <section className="py-16 px-4 md:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Featured Photos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.entries(imageUrls.featured).map(([key, url]) => (
            <div key={key} className="aspect-[4/3] relative">
              <Image
                src={url}
                alt={`Featured photo ${key}`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Specialties */}
      <section className="py-16 px-4 md:px-8 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-12">Our Specialties</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.entries(imageUrls.specialties).map(([key, url]) => (
            <div key={key} className="aspect-[4/3] relative">
              <Image
                src={url}
                alt={`${key} photography`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <h3 className="text-2xl font-bold text-white capitalize">{key}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">
            About MTP Collective
          </h2>
          <div className="max-w-3xl mx-auto text-gray-300 text-lg">
            <p className="mb-6">
              We are a collective of passionate photographers dedicated to capturing
              the essence of life through our lenses. From the energy of live
              concerts to the beauty of nature and the power of automotive design,
              we bring our unique perspective to every shot.
            </p>
            <p>
              Our mission is to create timeless images that tell stories and evoke
              emotions, preserving moments that would otherwise be lost to time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
