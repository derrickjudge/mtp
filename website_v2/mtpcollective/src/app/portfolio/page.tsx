import { SectionHeader } from '@/components/common/SectionHeader';
import { Image } from '@/components/common/Image';
import { imageUrls } from '@/utils/imageUrls';
import { PhotoGallery } from '@/components/photos/PhotoGallery';
import type { Photo } from '@/types/photo';

// Make this page dynamic to prevent Prisma initialization during build
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable static generation

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface CategoryWithPhotos extends Category {
  photos: Photo[];
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/categories`, {
      next: { revalidate: 60 },
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) {
      console.error('Failed to fetch categories:', res.status, res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

async function fetchPhotosByCategory(categoryId: string): Promise<Photo[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/photos?category=${categoryId}`, {
      next: { revalidate: 60 },
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) {
      console.error('Failed to fetch photos for category:', categoryId, res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    return data.photos || [];
  } catch (error) {
    console.error('Error fetching photos for category:', categoryId, error);
    return [];
  }
}

export default async function PortfolioPage() {
  // Fetch all categories
  const categories = await fetchCategories();
  
  // Fetch photos for each category
  const categoriesWithPhotos: CategoryWithPhotos[] = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      photos: await fetchPhotosByCategory(category.id),
    }))
  );

  // Filter out categories with no photos
  const categoriesWithContent = categoriesWithPhotos.filter(category => category.photos.length > 0);

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
              Explore our photography collections showcasing the art of capturing moments across different genres.
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Category Sections */}
      {categoriesWithContent.length > 0 ? (
        categoriesWithContent.map((category, index) => (
          <section 
            key={category.id} 
            className={`py-24 px-4 md:px-8 ${index % 2 === 0 ? 'bg-black' : 'bg-zinc-900'}`}
          >
            <div className="max-w-7xl mx-auto">
              <SectionHeader
                title={`${category.name} Photography`}
                subtitle={category.description || `Showcasing our ${category.name.toLowerCase()} photography collection`}
                className="mb-12"
              />
              <PhotoGallery photos={category.photos} columns={3} gap="lg" />
            </div>
          </section>
        ))
      ) : (
        // No categories with photos found
        <section className="py-24 px-4 md:px-8 bg-black">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Portfolio Coming Soon</h2>
            <p className="text-xl text-gray-400 mb-8">
              We're currently building our portfolio. Check back soon to see our latest work!
            </p>
            <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">📸</div>
              <p className="text-gray-300">
                New photos are being added regularly. Follow us on social media for updates!
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
} 