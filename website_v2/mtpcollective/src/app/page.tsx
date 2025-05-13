import Image from 'next/image';
import Link from 'next/link';
import { placeholderImages } from '@/utils/placeholderImages';

export default function Home() {
  return (
    <div className="flex flex-col gap-16">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src={placeholderImages.hero}
            alt="MTP Collective Photography"
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            MTP COLLECTIVE
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
            Capturing moments through a unique lens, specializing in concert, automotive, and nature photography.
          </p>
        </div>
      </section>

      {/* Featured Photos */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Featured Photography</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { src: placeholderImages.featured1, alt: 'Featured photo 1' },
            { src: placeholderImages.featured2, alt: 'Featured photo 2' },
            { src: placeholderImages.featured3, alt: 'Featured photo 3' }
          ].map((image, i) => (
            <div key={i} className="relative aspect-[4/3] group">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover rounded-lg transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Link href="/portfolio" className="text-white font-medium hover:underline">
                  View More
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Specialties */}
      <section className="bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Specialties</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Concert Photography',
                description: 'Capturing the energy and emotion of live performances.',
                image: placeholderImages.concert
              },
              {
                title: 'Automotive Photography',
                description: 'Showcasing the beauty and power of automotive design.',
                image: placeholderImages.automotive
              },
              {
                title: 'Nature Photography',
                description: 'Exploring the world through a natural lens.',
                image: placeholderImages.nature
              }
            ].map((specialty, i) => (
              <div key={i} className="relative aspect-[4/3] group">
                <Image
                  src={specialty.image}
                  alt={specialty.title}
                  fill
                  className="object-cover rounded-lg transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-xl font-bold mb-2">{specialty.title}</h3>
                  <p className="text-gray-300">{specialty.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">About MTP Collective</h2>
          <p className="text-gray-300 mb-8">
            We are a collective of passionate photographers dedicated to capturing the essence of life through our lenses. 
            Our work spans across various genres, from the raw energy of live concerts to the sleek lines of automotive design, 
            and the breathtaking beauty of nature.
          </p>
          <Link 
            href="/about" 
            className="inline-block px-6 py-3 bg-white text-black font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            Learn More About Us
          </Link>
        </div>
      </section>
    </div>
  );
}
