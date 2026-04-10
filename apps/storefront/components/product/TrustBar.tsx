import Link from "next/link";

interface Testimonial {
  _id: string;
  quote: string;
  name: string;
  company?: string;
}

interface TrustBarProps {
  followers?: string;
  realizations?: string;
  shippingLabel?: string;
  testimonials?: Testimonial[];
  opinionsLink?: string;
}

export function TrustBar({
  followers = "25 000+",
  realizations = "6 000+",
  shippingLabel = "Realizacja ok. 10 dni roboczych",
  testimonials = [],
  opinionsLink = "/dlaczego-lumine#opinie",
}: TrustBarProps) {
  const displayTestimonials = testimonials.slice(0, 3);

  return (
    <section className="border-t border-brand-100 bg-brand-50 py-12 lg:py-16">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-brand-500">
          <span>{followers} obserwujących</span>
          <span className="text-brand-300">&middot;</span>
          <span>{realizations} realizacji</span>
          <span className="text-brand-300">&middot;</span>
          <span>{shippingLabel}</span>
        </div>

        {displayTestimonials.length > 0 && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
            {displayTestimonials.map((t) => (
              <blockquote key={t._id} className="text-center">
                <p className="text-sm italic leading-relaxed text-brand-600">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-2 text-xs text-brand-400">
                  &mdash; {t.name}{t.company ? `, ${t.company}` : ""}
                </footer>
              </blockquote>
            ))}
          </div>
        )}

        <Link
          href={opinionsLink}
          className="mt-8 inline-block text-[11px] font-medium uppercase tracking-[0.2em] text-brand-500 hover:text-brand-900 transition-colors"
        >
          Więcej opinii &rarr;
        </Link>
      </div>
    </section>
  );
}
