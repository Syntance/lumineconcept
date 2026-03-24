import { Star } from "lucide-react";

const SALON_LOGOS = [
  "Salon Mia",
  "Beauty Lab",
  "Klinika Urody",
  "Studio Lashes",
  "Hair Concept",
  "Nail Room",
  "Brow Bar",
  "Skin Studio",
  "Beauty Point",
  "Glow Up",
  "Lash Queen",
  "Style Zone",
];

/** Karuzela „Zaufały nam” — pod hero, na tle brand-50 */
export function HomeTrustMarquee() {
  return (
    <div className="bg-brand-50 pt-4 pb-2.5 overflow-hidden md:pt-5 md:pb-3">
      <p className="text-center text-[10px] font-medium uppercase tracking-[0.25em] text-brand-400 mb-4">
        Zaufały nam
      </p>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-brand-50 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-brand-50 to-transparent z-10" />

        <div className="trust-scroll">
          {[...SALON_LOGOS, ...SALON_LOGOS].map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="mx-8 flex h-8 items-center opacity-40 hover:opacity-80 transition-opacity duration-300"
            >
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-brand-600 whitespace-nowrap">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-brand-400 flex items-center justify-center gap-1.5">
        <Star className="h-3 w-3 fill-accent text-accent" aria-hidden />
        <span className="font-medium text-brand-600">4.9</span>
        na Google
        <span className="mx-1 text-brand-300">&middot;</span>
        430+ opinii
      </p>
    </div>
  );
}
