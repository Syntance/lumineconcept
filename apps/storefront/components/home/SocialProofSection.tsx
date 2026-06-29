import { Gamepad2, Scissors, Zap, Palette } from "lucide-react";

const UVP_ITEMS = [
  {
    icon: Palette,
    title: "Nadruk UV",
    desc: "Kolory bez ograniczeń",
  },
  {
    icon: Gamepad2,
    title: "LED z pilotem",
    desc: "Twoje logo świeci tak, jak chcesz",
  },
  {
    icon: Scissors,
    title: "Wycinamy CNC",
    desc: "Nie ogranicza nas żaden kształt",
  },
  {
    icon: Zap,
    title: "Express 72h",
    desc: "Realizacja w 3 dni za dopłatą 50% wartości zamówienia",
  },
] as const;

export function SocialProofSection() {
  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4">
        {/* 4 UVP ikony */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 max-w-3xl mx-auto">
          {UVP_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 border border-brand-100">
                  <Icon className="h-5 w-5 text-accent-dark" />
                </div>
                <p className="mt-3 text-base font-medium uppercase tracking-widest text-brand-800">
                  {item.title}
                </p>
                <p className="mt-1 text-base text-brand-readable leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
