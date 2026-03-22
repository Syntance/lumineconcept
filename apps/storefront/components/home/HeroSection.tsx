import Link from "next/link";
import { Sparkles, Gamepad2, Scissors, Star } from "lucide-react";

const UVP_ITEMS = [
  {
    icon: Sparkles,
    title: "Matowe UV",
    desc: "Kolor, którego nie znajdziesz nigdzie indziej",
  },
  {
    icon: Gamepad2,
    title: "LED z pilotem",
    desc: "Twoje logo świeci tak, jak chcesz",
  },
  {
    icon: Scissors,
    title: "Dowolny kształt",
    desc: "Twoje logo nie musi być prostokątne",
  },
] as const;

const SALON_LOGOS = [
  "Salon Mia", "Beauty Lab", "Klinika Urody", "Studio Lashes",
  "Hair Concept", "Nail Room", "Brow Bar", "Skin Studio",
  "Beauty Point", "Glow Up", "Lash Queen", "Style Zone",
];

export function HeroSection() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-brand-300"
          style={{
            backgroundImage: "url('/images/hero.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-brand-900/30" />

        {/* Content — left-aligned on desktop, centered on mobile */}
        <div className="relative z-10 container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/80">
              Twój salon wygląda lepiej na Instagramie niż w rzeczywistości?
            </p>

            <h1 className="mt-5 font-display text-4xl text-white tracking-wide leading-tight sm:text-5xl lg:text-6xl">
              Branding, który wyróżnia Twój salon od pierwszej sekundy
            </h1>

            <p className="mt-5 text-sm text-white/80 max-w-md leading-relaxed">
              Logo na ścianę, cenniki, oznaczenia — od projektu do paczki w 72h
            </p>

            {/* UVP icons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-6">
              {UVP_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                      <Icon className="h-3.5 w-3.5 text-accent-light" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-white">{item.title}</p>
                      <p className="text-[10px] text-white/60">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/salony-beauty"
                className="inline-flex items-center justify-center border border-white px-8 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-brand-900"
              >
                Salony beauty &rarr;
              </Link>
              <Link
                href="/kontakt"
                className="text-[11px] font-medium text-white/70 hover:text-white transition-colors tracking-wide"
              >
                Inna branża?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar — "Zaufały nam" */}
      <div className="bg-brand-50 py-7 overflow-hidden">
        <p className="text-center text-[10px] font-medium uppercase tracking-[0.25em] text-brand-400 mb-5">
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

        <p className="mt-5 text-center text-xs text-brand-400 flex items-center justify-center gap-1.5">
          <Star className="h-3 w-3 fill-accent text-accent" />
          <span className="font-medium text-brand-600">4.9</span>
          na Google
          <span className="mx-1 text-brand-300">&middot;</span>
          430+ opinii
        </p>
      </div>
    </>
  );
}
