import Link from "next/link";
import { Star, Gamepad2, Scissors, Zap, Palette } from "lucide-react";

const UVP_ITEMS = [
  {
    icon: Palette,
    title: "Nadruk UV",
    desc: "Kolory bez ograniczeń",
  },
  {
    icon: Gamepad2,
    title: "LED z pilotem",
    desc: "Twoje logo świeci tak, jak chcesz",
  },
  {
    icon: Scissors,
    title: "Wycinamy CNC",
    desc: "Nie ogranicza nas żaden kształt",
  },
  {
    icon: Zap,
    title: "Express 72h",
    desc: "Realizacja w 3 dni za dopłatą 50% wartości zamówienia",
  },
] as const;

export function SocialProofSection() {
  return (
    <section className="pt-10 pb-16 lg:pt-10 lg:pb-24">
      <div className="container mx-auto px-4">
        {/* 4 UVP ikony */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 max-w-3xl mx-auto">
          {UVP_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 border border-brand-100">
                  <Icon className="h-5 w-5 text-accent-dark" />
                </div>
                <p className="mt-3 text-base font-medium uppercase tracking-widest text-brand-800">
                  {item.title}
                </p>
                <p className="mt-1 text-base text-brand-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Opinia klientki */}
        <blockquote className="mx-auto mt-20 max-w-2xl text-center">
          <div className="flex justify-center gap-0.5 mb-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-accent text-accent" />
            ))}
          </div>
          <p className="font-display text-[1.5rem] text-brand-800 leading-relaxed lg:text-[1.75rem]">
            &ldquo;Zamówiłam logo 3D — klientki nie przestają robić zdjęć&rdquo;
          </p>
          <footer className="mt-5">
            <p className="text-base font-medium uppercase tracking-[0.15em] text-brand-700">
              Ania
            </p>
            <p className="text-base text-brand-500">salon fryzjerski, Kraków</p>
          </footer>
        </blockquote>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/dlaczego-lumine"
            className="text-[14.2px] font-medium uppercase tracking-[0.216em] text-brand-500 hover:text-brand-900 transition-colors"
          >
            Zobacz opinie i porównanie &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
