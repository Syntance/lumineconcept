export default function SklepLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <section className="bg-brand-50 pt-10 pb-14 lg:pt-12 lg:pb-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex gap-2 mb-6">
            <div className="h-3 w-20 rounded bg-brand-200" />
            <div className="h-3 w-3 rounded bg-brand-200" />
            <div className="h-3 w-16 rounded bg-brand-200" />
          </div>
        </div>
        <div className="container mx-auto max-w-7xl px-4 pt-10 text-center lg:pt-16">
          <div className="mx-auto h-10 w-72 rounded bg-brand-200 lg:h-12 lg:w-96" />
          <div className="mx-auto mt-4 h-5 w-80 rounded bg-brand-200 lg:w-[28rem]" />
        </div>
      </section>

      {/* Grid skeleton */}
      <section className="bg-white py-10 lg:py-14">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square rounded-lg bg-brand-100" />
                <div className="h-4 w-3/4 rounded bg-brand-200" />
                <div className="h-4 w-1/3 rounded bg-brand-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
