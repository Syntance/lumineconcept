import { Clock, Truck, Wallet } from "lucide-react";

const BADGES = [
  {
    icon: Wallet,
    title: "Przelewy24",
    description: "BLIK, przelew, karta",
  },
  {
    icon: Truck,
    title: "DPD",
    description: "Przesyłka kurierska",
  },
  {
    icon: Clock,
    title: "PayPo",
    description: "Kup teraz, zapłać za 30 dni",
  },
] as const;

export function TrustBadges() {
  return (
    <section className="border-y border-brand-100 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.title} className="flex items-start gap-3">
                <Icon className="h-6 w-6 shrink-0 text-accent" />
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
