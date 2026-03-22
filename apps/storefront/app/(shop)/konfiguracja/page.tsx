import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

export const metadata: Metadata = {
  title: "Konfigurator produktu",
  description:
    "Skonfiguruj swój idealny produkt z plexi. Wybierz rozmiar, kolor, grubość i typ montażu.",
};

export default function KonfiguracjaPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Strona główna", href: "/" },
          { label: "Konfigurator" },
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-brand-900 text-center mb-4">
          Konfigurator produktu
        </h1>
        <p className="text-center text-brand-600 mb-12">
          Wybierz parametry, a my przygotujemy produkt dokładnie pod Twoje
          potrzeby.
        </p>

        <div className="rounded-lg border border-brand-200 p-8 text-center text-brand-500">
          <p className="text-lg">Konfigurator produktu w przygotowaniu</p>
          <p className="mt-2 text-sm">
            Trwają prace nad interaktywnym konfiguratorem. W międzyczasie skontaktuj się z nami przez formularz logo 3D.
          </p>
        </div>
      </div>
    </div>
  );
}
