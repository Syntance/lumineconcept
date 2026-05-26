import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PolitykaZwrotowDocument } from "@/components/legal/PolitykaZwrotowDocument";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Zwroty i reklamacje",
  description:
    "Polityka zwrotów i reklamacji Lumine Concept — jak zgłosić reklamację, adres do zwrotu, terminy oraz informacje o braku prawa odstąpienia dla produktów personalizowanych.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${SITE_URL}/zwroty`,
  },
};

export default function ZwrotyPage() {
  return (
    <div className="border-b border-brand-100 bg-brand-50/30">
      <div className="container mx-auto px-4 py-8 pb-16 sm:py-12">
        <Breadcrumbs
          items={[{ label: "Strona główna", href: "/" }, { label: "Zwroty i reklamacje" }]}
        />
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-[0.2em] text-brand-500">
            Lumine Concept
          </p>
          <h1 className="mb-6 text-center font-display text-2xl font-bold tracking-wide text-brand-800 sm:text-3xl">
            Zwroty i reklamacje
          </h1>
          <p className="mb-8 text-center text-sm text-brand-600">
            Masz pytania?{" "}
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
          <PolitykaZwrotowDocument />
        </div>
      </div>
    </div>
  );
}
