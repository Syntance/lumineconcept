import Link from "next/link";
import { Instagram } from "lucide-react";

const IG_PLACEHOLDERS = [1, 2, 3, 4, 5, 6];

export function FooterCTA() {
  return (
    <>
      {/* Footer CTA — ostatnia szansa na konwersję */}
      <section id="footer-cta" className="relative py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 bg-brand-800"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-brand-800/75" />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl text-white tracking-[0.08em] lg:text-4xl">
            Gotowa na branding, który wyróżni Twój salon?
          </h2>
          <div className="mt-4 mx-auto h-[1px] w-12 bg-accent-light" />

          <div className="mt-10 flex justify-center">
            <Link
              href="/produkty"
              className="inline-flex items-center justify-center border border-white px-8 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-brand-900"
            >
              Zobacz sklep &rarr;
            </Link>
          </div>

          <p className="mt-8 text-xs text-brand-400">
            Wolisz napisać?{" "}
            <a
              href="mailto:kontakt@lumineconcept.pl"
              className="text-brand-200 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              kontakt@lumineconcept.pl
            </a>
            <span className="mx-1.5 text-brand-500">&middot;</span>
            <a
              href="https://ig.me/m/lumineconcept"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-200 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              @lumineconcept
            </a>
          </p>
        </div>
      </section>

      {/* Feed IG */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl tracking-[0.1em] text-brand-800 lg:text-3xl">
            Jesteśmy na Instagramie
          </h2>
          <div className="mt-3 mx-auto h-[1px] w-12 bg-accent" />

          <div className="mt-10 grid grid-cols-3 gap-2 max-w-xl mx-auto sm:grid-cols-6">
            {IG_PLACEHOLDERS.map((n) => (
              <a
                key={n}
                href="https://instagram.com/lumineconcept"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Lumine Concept na Instagramie"
                className="aspect-square bg-brand-100 hover:bg-brand-200 transition-colors flex items-center justify-center"
              >
                <Instagram className="h-4 w-4 text-brand-400" />
              </a>
            ))}
          </div>

          <a
            href="https://instagram.com/lumineconcept"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-[11px] font-medium text-brand-500 hover:text-brand-900 transition-colors tracking-wide"
          >
            Zobacz nasze realizacje &rarr;
          </a>
        </div>
      </section>
    </>
  );
}
