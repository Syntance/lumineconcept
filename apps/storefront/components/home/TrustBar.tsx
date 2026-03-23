import { Instagram } from "lucide-react";

const SALON_LOGOS = [
  "Salon Mia", "Beauty Lab", "Klinika Urody", "Studio Lashes",
  "Hair Concept", "Nail Room", "Brow Bar", "Skin Studio",
  "Beauty Point", "Glow Up", "Lash Queen", "Style Zone",
];

export function TrustBar() {
  return (
    <section className="bg-brand-50 py-8 overflow-hidden">
      <div className="container mx-auto px-4">
        <p className="text-center text-[10px] font-medium uppercase tracking-[0.25em] text-brand-400 mb-6">
          Zaufały nam
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-brand-50 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-brand-50 to-transparent z-10" />

        <div className="trust-scroll">
          {[...SALON_LOGOS, ...SALON_LOGOS].map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="mx-8 flex h-8 items-center justify-center opacity-40 hover:opacity-80 transition-opacity duration-300"
            >
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-brand-600 whitespace-nowrap">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">
        <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-xs text-brand-400">
          <Instagram className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
          <span className="font-medium text-brand-600">25 000+ obserwujących</span>
          <span className="mx-1.5 text-brand-300">&middot;</span>
          <span className="text-brand-600">6 000+ realizacji</span>
        </p>
      </div>
    </section>
  );
}
