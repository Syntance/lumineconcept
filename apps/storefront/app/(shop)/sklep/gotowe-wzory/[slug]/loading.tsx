export default function ProductLoading() {
  return (
    <div className="animate-pulse">
      {/* Breadcrumbs */}
      <div className="container mx-auto max-w-4xl px-4 pt-10 pb-5 lg:pt-12 lg:pb-6">
        <div className="flex gap-2">
          <div className="h-3 w-16 rounded bg-brand-200" />
          <div className="h-3 w-3 rounded bg-brand-200" />
          <div className="h-3 w-24 rounded bg-brand-200" />
          <div className="h-3 w-3 rounded bg-brand-200" />
          <div className="h-3 w-32 rounded bg-brand-200" />
        </div>
      </div>

      <div className="bg-brand-50">
        <div className="mx-auto max-w-[min(102rem,calc(100vw-2rem))] px-4 py-6 lg:px-8 lg:py-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            {/* Gallery skeleton */}
            <div className="space-y-3">
              <div className="aspect-square rounded-lg bg-brand-100" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 w-16 rounded bg-brand-100" />
                ))}
              </div>
            </div>

            {/* Product info skeleton */}
            <div className="space-y-5">
              <div className="h-8 w-3/4 rounded bg-brand-200 lg:h-10" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-brand-200" />
                <div className="h-4 w-48 rounded bg-brand-200" />
              </div>
              <div className="h-10 w-32 rounded-full bg-brand-200" />

              <div className="flex items-center gap-4 pt-3">
                <div className="h-px flex-1 bg-brand-200" />
                <div className="h-4 w-48 rounded bg-brand-200" />
                <div className="h-px flex-1 bg-brand-200" />
              </div>

              {/* Config options skeleton */}
              <div className="space-y-4 pt-2">
                <div className="h-5 w-24 rounded bg-brand-200" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-brand-100" />
                  ))}
                </div>
                <div className="h-5 w-28 rounded bg-brand-200" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 w-20 rounded bg-brand-100" />
                  ))}
                </div>
              </div>

              {/* Add to cart skeleton */}
              <div className="h-14 w-full rounded-md bg-brand-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
