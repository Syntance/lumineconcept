import Link from "next/link";
import {
  averageRatingFromReviews,
  type ProductReviewItem,
} from "@/lib/products/product-reviews";

interface ProductReviewsProps {
  reviews?: ProductReviewItem[];
}

function Stars({ rating = 0, max = 5 }: { rating?: number; max?: number }) {
  const full = Math.min(max, Math.max(0, Math.round(rating)));
  return (
    <div className="flex gap-0.5" aria-label={`Ocena ${full} z ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={`h-5 w-5 ${i < full ? "text-amber-400" : "text-brand-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function ProductReviews({ reviews = [] }: ProductReviewsProps) {
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0 ? averageRatingFromReviews(reviews) : 0;

  return (
    <section id="opinie" className="border-t border-brand-100 bg-white py-12 lg:py-16">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-display text-2xl tracking-widest text-brand-800">
          Opinie klientów
        </h2>
        <div className="mt-3 mx-auto h-px w-12 bg-accent" />

        <div className="mt-8 flex flex-col items-center gap-3">
          <Stars rating={Math.round(averageRating)} />
          <p className="text-sm text-brand-500">
            {reviewCount > 0
              ? `${averageRating.toFixed(1)} / 5 — ${reviewCount} ${reviewCount === 1 ? "opinia" : reviewCount < 5 ? "opinie" : "opinii"}`
              : "Brak opinii"}
          </p>
        </div>

        {reviewCount > 0 && (
          <ul className="mt-10 space-y-6 text-left">
            {reviews.map((r, i) => (
              <li
                key={`${r.author}-${i}`}
                className="rounded-xl border border-brand-100 bg-brand-50/80 px-5 py-4 text-left shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-brand-800">{r.author}</span>
                  {r.date && (
                    <span className="text-xs text-brand-400">{r.date}</span>
                  )}
                </div>
                <div className="mt-2">
                  <Stars rating={r.rating} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-brand-700">
                  {r.text}
                </p>
              </li>
            ))}
          </ul>
        )}

        {reviewCount === 0 && (
          <div className="mt-8 rounded-xl border border-brand-100 bg-brand-50 px-6 py-8">
            <p className="text-sm text-brand-600">
              Bądź pierwszą osobą, która zostawi opinię o tym produkcie.
            </p>
            <Link
              href="https://www.instagram.com/lumineconcept/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center rounded border border-brand-300 px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-brand-700 transition-colors hover:bg-brand-100"
            >
              Napisz do nas &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
