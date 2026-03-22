import Link from "next/link";
import { Star, Sparkles, Gamepad2, Scissors, Zap, ShieldCheck } from "lucide-react";

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
    desc: "Babeczka, liść, nożyczki — wycinamy wszystko",
  },
  {
    icon: Zap,
    title: "Express 72h",
    desc: "Otwierasz salon w piątek? Logo będzie gotowe",
  },
  {
    icon: ShieldCheck,
    title: "Projekt do satysfakcji",
    desc: "Poprawiamy aż powiesz: idealnie",
  },
] as const;

export function SocialProofSection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Cytat */}
        <blockquote className="mx-auto max-w-xl text-center">
          <div className="flex justify-center gap-0.5 mb-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-accent text-accent" />
            ))}
          </div>
          <p className="font-display text-xl text-brand-900 leading-relaxed lg:text-2xl">
            &ldquo;Zamówiłam logo z matowym UV — klientki pytają skąd mam&rdquo;
          </p>
          <footer className="mt-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-brand-700">
              Ania
            </p>
            <p className="text-xs text-brand-500">salon fryzjerski, Kraków</p>
          </footer>
        </blockquote>

        {/* 5 UVP ikon */}
        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5 max-w-3xl mx-auto">
          {UVP_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 border border-brand-100">
                  <Icon className="h-4 w-4 text-accent-dark" />
                </div>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.1em] text-brand-800">
                  {item.title}
                </p>
                <p className="mt-1 text-[10px] text-brand-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/dlaczego-lumine"
            className="text-[11px] font-medium text-brand-500 hover:text-brand-900 transition-colors tracking-wide"
          >
            Zobacz opinie i porównanie &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
