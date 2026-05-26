import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PolitykaPrywatnosciDocument } from "@/components/legal/PolitykaPrywatnosciDocument";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description:
    "Polityka prywatności Lumine Concept — informacje o administratorze danych, celach i podstawach przetwarzania, prawach Klienta, plikach cookies oraz bezpieczeństwie danych.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${SITE_URL}/polityka-prywatnosci`,
  },
};

export default function PolitykaPrywatnosciPage() {
  return (
    <div className="border-b border-brand-100 bg-brand-50/30">
      <div className="container mx-auto px-4 py-8 pb-16 sm:py-12">
        <Breadcrumbs
          items={[{ label: "Strona główna", href: "/" }, { label: "Polityka prywatności" }]}
        />
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-[0.2em] text-brand-500">
            Lumine Concept
          </p>
          <h1 className="mb-6 text-center font-display text-2xl font-bold tracking-wide text-brand-800 sm:text-3xl">
            Polityka prywatności
          </h1>
          <p className="mb-8 text-center text-sm text-brand-600">
            Pytania o dane?{" "}
            <a
              href="mailto:kontakt@lumineconcept.pl"
              className="font-medium text-brand-800 underline underline-offset-2 hover:text-brand-900"
            >
              kontakt@lumineconcept.pl
            </a>
            {" · "}
            <Link
              href="/regulamin"
              className="font-medium underline underline-offset-2 hover:text-brand-900"
            >
              Regulamin
            </Link>
          </p>
          <PolitykaPrywatnosciDocument />
        </div>
      </div>
    </div>
  );
}
