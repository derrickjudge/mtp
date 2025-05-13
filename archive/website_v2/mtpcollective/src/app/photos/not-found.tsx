import Link from 'next/link';

export default function PhotoNotFound() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Photo Not Found</h2>
        <p className="text-gray-600 mb-6">
          The photo you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <Link
          href="/photos"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          View All Photos
        </Link>
      </div>
    </main>
  );
}
