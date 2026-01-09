/**
 * Loading skeleton for character grid
 * Used as Suspense fallback for DiscoverSection
 */
export function CharactersSkeleton() {
  return (
    <section className="py-6 md:py-10 bg-black relative">
      {/* Background elements to match DiscoverSection */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full px-6 md:px-8 max-w-[1400px] mx-auto relative z-10">
        {/* Header Skeleton */}
        <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between mb-8 gap-6">
          <div className="w-full xl:w-auto max-w-3xl">
            <div className="h-12 w-80 bg-white/5 rounded-lg animate-pulse mb-4" />
            <div className="h-6 w-96 bg-white/5 rounded-lg animate-pulse" />
          </div>

          {/* Filter Tabs Skeleton */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 w-20 bg-white/5 rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        {/* Character Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>

        {/* Load More Button Skeleton */}
        <div className="mt-16 text-center">
          <div className="h-14 w-48 bg-white/5 rounded-2xl animate-pulse mx-auto" />
        </div>
      </div>
    </section>
  );
}
