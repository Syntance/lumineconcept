import { Shield, Truck, RotateCcw, CreditCard } from "lucide-react";

const BADGES = [
  {
    icon: Shield,
    title: "Bezpieczne płatności",
    description: "Przelewy24, BLIK, karty",
  },
  {
    icon: Truck,
    title: "Szybka dostawa",
    description: "InPost Paczkomat od 1 dnia",
  },
  {
    icon: RotateCcw,
    title: "14 dni na zwrot",
    description: "Bez podawania przyczyny",
  },
  {
    icon: CreditCard,
    title: "Kup teraz, zapłać później",
    description: "PayPo — 30 dni bez odsetek",
  },
] as const;

export function TrustBadges() {
  return (
    <section className="border-y border-brand-100 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.title} className="flex items-start gap-3">
                <Icon className="h-6 w-6 flex-shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-medium text-brand-900">
                    {badge.title}
                  </p>
                  <p className="text-xs text-brand-500">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
