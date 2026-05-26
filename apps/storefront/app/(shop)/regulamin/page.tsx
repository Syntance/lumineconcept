import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { RegulaminDocument } from "@/components/legal/RegulaminDocument";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Regulamin sklepu internetowego",
  description:
    "Regulamin Lumine Concept — zasady składania zamówień, reklamacje, dostawa, płatności, odstąpienie od umowy i postanowienia końcowe.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${SITE_URL}/regulamin`,
  },
};

export default function RegulaminPage() {
  return (
    <div className="border-b border-brand-100 bg-brand-50/30">
      <div className="container mx-auto px-4 py-8 pb-16 sm:py-12">
        <Breadcrumbs items={[{ label: "Strona główna", href: "/" }, { label: "Regulamin" }]} />
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-[0.2em] text-brand-500">
            Lumine Concept
          </p>
          <h1 className="mb-6 text-center font-display text-2xl font-bold tracking-wide text-brand-800 sm:text-3xl">
            Regulamin sklepu internetowego
          </h1>
          <p className="mb-8 text-center text-sm text-brand-600">
            Potrzebujesz pomocy?{" "}
            <a
              href="mailto:kontakt@lumineconcept.pl"
              className="font-medium text-brand-800 underline underline-offset-2 hover:text-brand-900"
            >
              kontakt@lumineconcept.pl
            </a>
            {" · "}
            <Link href="/polityka-prywatnosci" className="font-medium underline underline-offset-2 hover:text-brand-900">
              Polityka prywatności
            </Link>
          </p>
          <RegulaminDocument />
        </div>
      </div>
    </div>
  );
}
