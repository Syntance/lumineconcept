import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Logo3DFormClient } from "./client";

export const metadata: Metadata = {
  title: "Logo 3D — Prześlij swoje logo",
  description:
    "Prześlij swoje logo, a my przygotujemy wycenę i wizualizację 3D w ciągu 24 godzin. Bezpłatna wycena.",
};

export default function Logo3DPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Strona główna", href: "/" },
          { label: "Logo 3D" },
        ]}
      />
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-brand-800 text-center mb-4">
          Logo 3D dla Twojego salonu
        </h1>
        <p className="text-center text-brand-600 mb-8">
          Prześlij swoje logo, podaj wymiary i oczekiwania — przygotujemy
          bezpłatną wycenę i wizualizację w ciągu 24 godzin.
        </p>
        <Logo3DFormClient />
      </div>
    </div>
  );
}
