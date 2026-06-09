import type { Metadata } from "next";
import Link from "next/link";
import {
  Truck,
  Package,
  Clock,
  CreditCard,
  ShieldCheck,
  Banknote,
  Mail,
  MapPin,
} from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dostawa i płatności",
  description:
    "Sprawdź dostępne sposoby dostawy oraz formy płatności w sklepie Lumine Concept — kurier, paczkomat, Przelewy24, BLIK, przelew tradycyjny i zamówienie express (3 dni).",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${SITE_URL}/dostawa-i-platnosci`,
  },
};

const SHIPPING_METHODS = [
  {
    icon: Truck,
    title: "Kurier",
    lead: "1–2 dni robocze",
    description:
      "Przesyłki realizujemy renomowanymi firmami kurierskimi. Po nadaniu otrzymujesz numer śledzenia mailem.",
  },
  {
    icon: Package,
    title: "Paczkomat InPost",
    lead: "Do 24 h od nadania",
    description:
      "Wygodny odbiór 24/7 w wybranym przez Ciebie paczkomacie. Idealny do mniejszych zamówień.",
  },
  {
    icon: MapPin,
    title: "Odbiór osobisty",
    lead: "Bez kosztów dostawy",
    description:
      "Po wcześniejszym uzgodnieniu mailowym możesz odebrać zamówienie z naszej pracowni w Ryczowie.",
  },
];

const PAYMENT_METHODS = [
  {
    icon: CreditCard,
    title: "Przelewy24",
    lead: "BLIK · przelew online · karta",
    description:
      "Szybkie płatności online obsługiwane przez Przelewy24 — wybierz BLIK, przelew z banku lub kartę.",
  },
  {
    icon: Banknote,
    title: "Przelew tradycyjny",
    lead: "5 dni roboczych na opłacenie",
    description:
      "Dane do przelewu otrzymasz w mailu potwierdzającym Zamówienie. Po zaksięgowaniu wpłaty rozpoczynamy realizację.",
  },
  {
    icon: ShieldCheck,
    title: "Faktura VAT",
    lead: "Na życzenie",
    description:
      "Chcesz fakturę VAT? Zaznacz tę opcję i podaj NIP podczas składania Zamówienia — fakturę otrzymasz mailem.",
  },
];

function CardGrid({
  items,
}: {
  items: { icon: typeof Truck; title: string; lead: string; description: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ icon: Icon, title, lead, description }) => (
        <div
          key={title}
          className="flex flex-col gap-3 rounded-lg border border-brand-200 bg-white p-5 shadow-sm transition-shadow hover:shadow"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold text-brand-900">{title}</h3>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-500">
                {lead}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-brand-700">{description}</p>
        </div>
      ))}
    </div>
  );
}

export default function DostawaIPlatnosciPage() {
  return (
    <div className="border-b border-brand-100 bg-brand-50/30">
      <div className="container mx-auto px-4 py-8 pb-16 sm:py-12">
        <Breadcrumbs
          items={[{ label: "Strona główna", href: "/" }, { label: "Dostawa i płatności" }]}
        />

        <div className="mx-auto max-w-4xl">
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-[0.2em] text-brand-500">
            Lumine Concept
          </p>
          <h1 className="mb-4 text-center font-display text-3xl font-bold tracking-wide text-brand-800 sm:text-4xl">
            Dostawa i płatności
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-pretty text-center text-brand-700">
            Każde zamówienie pakujemy tak, żeby Twoje plexi dotarło w idealnym stanie. Wybierz formę dostawy
            i płatności wygodną dla Ciebie — wszystko ustalisz w jednym kroku w koszyku.
          </p>

          {/* Dostawa */}
          <section aria-labelledby="dostawa" className="mb-14">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Truck className="h-4 w-4" aria-hidden />
              </span>
              <h2
                id="dostawa"
                className="font-display text-xl font-bold uppercase tracking-wide text-brand-800"
              >
                Sposoby dostawy
              </h2>
            </div>
            <CardGrid items={SHIPPING_METHODS} />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-brand-200 bg-white p-5">
                <h3 className="mb-1 flex items-center gap-2 font-semibold text-brand-900">
                  <Clock className="h-4 w-4 text-brand-500" aria-hidden /> Standardowy czas realizacji
                </h3>
                <p className="text-sm leading-relaxed text-brand-700">
                  Do <span className="font-semibold">14 dni roboczych</span> od zaksięgowania wpłaty —
                  najczęściej szybciej. Dokładny czas znajdziesz w opisie każdego produktu.
                </p>
              </div>
              <div className="rounded-lg border-2 border-brand-300 bg-brand-50 p-5">
                <h3 className="mb-1 flex items-center gap-2 font-semibold text-brand-900">
                  <span className="inline-flex h-5 items-center rounded-full bg-brand-700 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                    Express
                  </span>{" "}
                  Zamówienie express
                </h3>
                <p className="text-sm leading-relaxed text-brand-800">
                  Realizacja do <span className="font-semibold">3 dni roboczych</span> za dopłatą{" "}
                  <span className="font-semibold">50% wartości zamówienia</span>. Opcję wybierzesz przy
                  składaniu zamówienia.
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-brand-600">
              Dostawy realizujemy wyłącznie na terenie Polski. Koszt dostawy zależy od wagi i rozmiaru
              zamówienia — finalna kwota widoczna jest w koszyku przed złożeniem zamówienia.
            </p>
          </section>

          {/* Płatności */}
          <section aria-labelledby="platnosci" className="mb-14">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <CreditCard className="h-4 w-4" aria-hidden />
              </span>
              <h2
                id="platnosci"
                className="font-display text-xl font-bold uppercase tracking-wide text-brand-800"
              >
                Formy płatności
              </h2>
            </div>
            <CardGrid items={PAYMENT_METHODS} />

            <div className="mt-6 rounded-lg border border-brand-200 bg-white p-5 text-sm leading-relaxed text-brand-700">
              <p>
                Rozliczenia transakcji elektronicznych i kartą płatniczą realizujemy za pośrednictwem
                upoważnionych operatorów. Wybór płatności może zależeć od wybranego sposobu dostawy —
                wszystkie dostępne opcje zobaczysz w koszyku.
              </p>
              <p className="mt-2">
                Jeśli wybierzesz <span className="font-semibold">przelew tradycyjny</span>, prosimy o
                opłacenie zamówienia w ciągu <span className="font-semibold">5 dni roboczych</span> od jego
                złożenia.
              </p>
            </div>
          </section>

          {/* Bezpieczeństwo + pomoc */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-brand-200 bg-white p-6">
              <h3 className="mb-2 flex items-center gap-2 font-display text-base font-semibold text-brand-900">
                <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden /> Bezpieczne zakupy
              </h3>
              <p className="text-sm leading-relaxed text-brand-700">
                Płatności są obsługiwane przez certyfikowanych dostawców, a sklep działa wyłącznie po HTTPS.
                Po złożeniu zamówienia otrzymasz e-mail z potwierdzeniem i statusem realizacji.
              </p>
            </div>
            <div className="rounded-lg border border-brand-200 bg-white p-6">
              <h3 className="mb-2 flex items-center gap-2 font-display text-base font-semibold text-brand-900">
                <Mail className="h-4 w-4 text-brand-600" aria-hidden /> Masz pytania?
              </h3>
              <p className="mb-3 text-sm leading-relaxed text-brand-700">
                Napisz do nas — pomożemy dobrać optymalny sposób dostawy i płatności do Twojego zamówienia.
              </p>
              <a
                href="mailto:kontakt@lumineconcept.pl"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 underline underline-offset-2 hover:text-brand-900"
              >
                kontakt@lumineconcept.pl
              </a>
            </div>
          </section>

          <p className="mt-10 text-center text-sm text-brand-600">
            Szczegółowe zasady dostawy i płatności znajdziesz w{" "}
            <Link href="/regulamin" className="font-semibold underline underline-offset-2 hover:text-brand-900">
              regulaminie sklepu
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
