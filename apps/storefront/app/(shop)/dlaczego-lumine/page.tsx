import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "O nas — W budowie",
  description: "Ta strona jest tymczasowo niedostępna. Trwają prace nad sekcją O nas.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/dlaczego-lumine`,
  },
};

export default function DlaczegoLuminePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Strona główna", href: "/" },
          { label: "O nas" },
        ]}
      />
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-center font-display text-3xl font-bold text-brand-800">
          O nas
        </h1>
        <div className="rounded-lg border border-brand-200 p-8 text-center text-brand-500">
          <p className="text-lg">Strona w budowie</p>
          <p className="mt-2 text-sm">Wróć wkrótce — kończymy prace nad tą podstroną.</p>
          <Link
            href="/kontakt"
            className="mt-6 inline-flex rounded-md border border-brand-300 px-5 py-2.5 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50"
          >
            Napisz do nas
          </Link>
        </div>
      </div>
    </div>
  );
}
