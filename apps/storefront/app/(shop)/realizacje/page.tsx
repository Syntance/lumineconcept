import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

export const metadata: Metadata = {
  title: "Realizacje",
  description:
    "Galeria naszych realizacji. Zobacz, jak produkty Lumine wyglądają w salonach beauty naszych klientów.",
};

export default function RealizacjePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Strona główna", href: "/" },
          { label: "Realizacje" },
        ]}
      />
      <h1 className="font-display text-3xl font-bold text-brand-800 mb-4">
        Nasze realizacje
      </h1>
      <p className="text-brand-600 max-w-2xl mb-12">
        Zobacz, jak nasze produkty z plexi wyglądają w salonach beauty naszych
        klientów. Każda realizacja jest unikalna i dopasowana do charakteru marki.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] rounded-lg bg-brand-100 flex items-center justify-center"
          >
            <span className="text-sm text-brand-400">
              Realizacja {i + 1} — dodaj zdjęcia z Cloudinary
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
