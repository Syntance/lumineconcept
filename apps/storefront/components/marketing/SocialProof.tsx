import { Star } from "lucide-react";

interface SocialProofProps {
  testimonials: Array<{
    name: string;
    role: string;
    company: string;
    quote: string;
    rating: number;
  }>;
}

export function SocialProof({ testimonials }: SocialProofProps) {
  return (
    <section className="bg-brand-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-2xl font-bold text-brand-800 text-center mb-12">
          Co mówią nasi klienci
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote
              key={testimonial.name}
              className="rounded-lg bg-white p-6 shadow-sm"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < testimonial.rating
                        ? "fill-accent text-accent"
                        : "text-brand-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-brand-700 italic leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <footer className="mt-4">
                <p className="text-sm font-medium text-brand-800">
                  {testimonial.name}
                </p>
                <p className="text-xs text-brand-500">
                  {testimonial.role}, {testimonial.company}
                </p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
