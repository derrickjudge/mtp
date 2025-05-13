export default function LoadingPhotos() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-6 w-96 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse">
            <div className="w-full h-full relative overflow-hidden rounded-lg" />
          </div>
        ))}
      </div>
    </main>
  );
}
