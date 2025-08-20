import { SectionHeader } from '@/components/common/SectionHeader';
import { Image } from '@/components/common/Image';
import { imageUrls } from '@/utils/imageUrls';
import { PhotoGallery } from '@/components/photos/PhotoGallery';
import type { Photo } from '@/types/photo';
import { nativeDB } from '@/lib/db-native';
import Link from 'next/link';

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
    const categories = await nativeDB.findCategories();
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

async function fetchPhotosByCategory(categoryId: string): Promise<Photo[]> {
  try {
    const photos = await nativeDB.findPhotos({
      categoryId,
      published: true,
    });
    return photos;
  } catch (error) {
    console.error('Error fetching photos for category:', categoryId, error);
    return [];
  }
}

async function fetchAllPhotos(): Promise<Photo[]> {
  try {
    const photos = await nativeDB.findPhotos({
      published: true,
    });
    return photos;
  } catch (error) {
    console.error('Error fetching all photos:', error);
    return [];
  }
}

interface PortfolioPageProps {
  searchParams: { category?: string };
}

export default async function PortfolioPage({ searchParams }: PortfolioPageProps) {
  // Fetch all categories
  const categories = await fetchCategories();
  const categorySlug = searchParams.category;
  
  // Find the selected category if one is specified
  const selectedCategory = categorySlug 
    ? categories.find(cat => cat.slug === categorySlug)
    : null;

  let categoriesWithPhotos: CategoryWithPhotos[] = [];
  let allPhotos: Photo[] = [];

  if (selectedCategory) {
    // Show only the selected category
    const photos = await fetchPhotosByCategory(selectedCategory.id);
    categoriesWithPhotos = [{
      ...selectedCategory,
      photos
    }];
  } else {
    // Show all categories
    categoriesWithPhotos = await Promise.all(
      categories.map(async (category) => ({
        ...category,
        photos: await fetchPhotosByCategory(category.id),
      }))
    );
  }

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
            {selectedCategory ? (
              <>
                <nav className="text-sm text-gray-300 mb-4">
                  <Link href="/portfolio" className="hover:text-white transition-colors">
                    Portfolio
                  </Link>
                  <span className="mx-2">→</span>
                  <span className="text-white">{selectedCategory.name}</span>
                </nav>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                  {selectedCategory.name}
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 font-light max-w-2xl mx-auto">
                  {selectedCategory.description || `Showcasing our ${selectedCategory.name.toLowerCase()} photography collection`}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                  Portfolio
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 font-light max-w-2xl mx-auto">
                  Explore our photography collections showcasing the art of capturing moments across different genres.
                </p>
              </>
            )}
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
              We&apos;re currently building our portfolio. Check back soon to see our latest work!
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