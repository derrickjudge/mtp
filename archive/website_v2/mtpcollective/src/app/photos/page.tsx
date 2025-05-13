import { Metadata } from 'next';
import { PhotoGrid } from './components/PhotoGrid';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Photos | MTP Collective',
  description: 'Browse our collection of photos from talented photographers.',
};

export const revalidate = 3600; // Revalidate every hour

async function getPhotos() {
  const result = await prisma.$queryRaw`
    SELECT 
      p.id,
      p.title,
      p.description,
      p.url,
      p.thumbnail,
      p.featured,
      json_build_object(
        'id', u.id,
        'name', u.name
      ) as author
    FROM "Photo" p
    JOIN "User" u ON p."authorId" = u.id
    WHERE p.published = true
    ORDER BY p."createdAt" DESC
  `;

  return result as Array<{
    id: string;
    title: string;
    description: string | null;
    url: string;
    thumbnail: string | null;
    featured: boolean;
    author: {
      id: string;
      name: string;
    };
  }>;
}

export default async function PhotosPage() {
  const photos = await getPhotos();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Photos</h1>
        <p className="text-gray-600">
          Browse our collection of photos from talented photographers.
        </p>
      </div>

      <PhotoGrid photos={photos} />
    </main>
  );
}
