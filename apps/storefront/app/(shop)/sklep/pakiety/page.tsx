import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pakiety brandingowe — ogarnij cały salon w jednym zamówieniu | Lumine Concept",
  description:
    "Cennik + tabliczki + logo — wszystko spójne. Oszczędź do -15% vs pojedyncze produkty. Sprawdź pakiety.",
  alternates: { canonical: `${SITE_URL}/sklep/pakiety` },
};

const TIERS = [
  {
    name: "Starter",
    emoji: "🥉",
    features: {
      cennik: "✅",
      tabliczki: "2 szt.",
      logo3d: "—",
      qrCode: "—",
      wizytownik: "—",
    },
    discount: "-5%",
    cta: "Wybierz Starter",
    slug: "pakiet-starter",
    highlight: false,
  },
  {
    name: "Full",
    emoji: "🥈",
    features: {
      cennik: "✅",
      tabliczki: "4 szt.",
      logo3d: "✅ klasyczne",
      qrCode: "✅",
      wizytownik: "—",
    },
    discount: "-10%",
    cta: "Wybierz Full",
    slug: "pakiet-full",
    highlight: true,
  },
  {
    name: "Premium",
    emoji: "🥇",
    features: {
      cennik: "✅ z LED",
      tabliczki: "6 szt.",
      logo3d: "✅ z LED",
      qrCode: "✅",
      wizytownik: "✅",
    },
    discount: "-15%",
    cta: "Wybierz Premium",
    slug: "pakiet-premium",
    highlight: false,
  },
] as const;

const FEATURE_LABELS: Record<string, string> = {
  cennik: "Cennik",
  tabliczki: "Tabliczki",
  logo3d: "Logo 3D",
  qrCode: "QR code",
  wizytownik: "Wizytownik",
};

export default function PakietyPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-50 py-14 lg:py-20">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <Breadcrumbs
            items={[
              { label: "Strona główna", href: "/" },
              { label: "Sklep", href: "/sklep" },
              { label: "Pakiety" },
            ]}
          />
          <h1 className="font-display text-3xl tracking-[0.06em] text-brand-800 lg:text-4xl">
            Pakiety brandingowe — ogarnij cały salon w jednym zamówieniu
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-brand-600 leading-relaxed">
            Cennik + tabliczki + logo — wszystko spójne. Oszczędź do -15% vs pojedyncze produkty.
          </p>
        </div>
      </section>

      {/* Comparison table — desktop */}
      <section className="bg-white py-14 lg:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          {/* Desktop table */}
          <div className="hidden lg:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-4 text-left text-brand-500 font-medium" />
                  {TIERS.map((tier) => (
                    <th
                      key={tier.name}
                      className={`p-4 text-center ${tier.highlight ? "bg-brand-50 rounded-t-xl" : ""}`}
                    >
                      <span className="text-2xl">{tier.emoji}</span>
                      <p className="mt-2 font-display text-lg text-brand-800">{tier.name}</p>
                      <p className="mt-1 text-xs font-semibold text-green-700">{tier.discount}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                  <tr key={key} className="border-t border-brand-100">
                    <td className="p-4 font-medium text-brand-700">{label}</td>
                    {TIERS.map((tier) => (
                      <td
                        key={tier.name}
                        className={`p-4 text-center text-brand-600 ${tier.highlight ? "bg-brand-50" : ""}`}
                      >
                        {tier.features[key as keyof typeof tier.features]}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-brand-200">
                  <td className="p-4" />
                  {TIERS.map((tier) => (
                    <td
                      key={tier.name}
                      className={`p-4 text-center ${tier.highlight ? "bg-brand-50 rounded-b-xl" : ""}`}
                    >
                      <Link
                        href={`/sklep/pakiety/${tier.slug}`}
                        className={`inline-flex items-center justify-center rounded-md px-6 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                          tier.highlight
                            ? "bg-brand-900 text-white hover:bg-brand-800"
                            : "border border-brand-200 text-brand-700 hover:bg-brand-50"
                        }`}
                      >
                        {tier.cta} &rarr;
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="flex flex-col gap-6 lg:hidden">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-6 ${
                  tier.highlight
                    ? "border-brand-300 bg-brand-50 shadow-sm"
                    : "border-brand-100 bg-white"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{tier.emoji}</span>
                  <div>
                    <h2 className="font-display text-lg text-brand-800">{tier.name}</h2>
                    <p className="text-xs font-semibold text-green-700">{tier.discount}</p>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                    <li key={key} className="flex items-center justify-between text-sm">
                      <span className="text-brand-600">{label}</span>
                      <span className="font-medium text-brand-800">
                        {tier.features[key as keyof typeof tier.features]}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/sklep/pakiety/${tier.slug}`}
                  className={`block w-full rounded-md py-2.5 text-center text-sm font-medium uppercase tracking-wider transition-colors ${
                    tier.highlight
                      ? "bg-brand-900 text-white hover:bg-brand-800"
                      : "border border-brand-200 text-brand-700 hover:bg-brand-50"
                  }`}
                >
                  {tier.cta} &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom banner */}
      <section className="bg-brand-50 py-12 lg:py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
            <p className="font-display text-xl tracking-wide text-brand-800">
              Potrzebujesz niestandardowy zestaw?
            </p>
            <p className="text-sm text-brand-600">
              Skonfigurujemy pakiet pod Twój salon — wycena w 24h
            </p>
            <Link
              href="/logo-3d/#formularz"
              className="mt-2 inline-flex items-center justify-center rounded-md bg-brand-900 px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-brand-800"
            >
              Zamów wycenę &rarr;
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
