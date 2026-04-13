import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

export const metadata: Metadata = {
  title: "Salony Beauty — W budowie",
  description:
    "Ta strona jest tymczasowo niedostępna. Trwają prace.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://lumine.syntance.dev"}/salony-beauty`,
  },
};

export default function SalonyBeautyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Strona główna", href: "/" },
          { label: "Salony Beauty" },
        ]}
      />
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-center font-display text-3xl font-bold text-brand-800">
          Salony Beauty
        </h1>
        <div className="rounded-lg border border-brand-200 p-8 text-center text-brand-500">
          <p className="text-lg">Strona w budowie</p>
          <p className="mt-2 text-sm">Wróć wkrótce — kończymy prace nad tą podstroną.</p>
        </div>
      </div>
    </div>
  );
}
