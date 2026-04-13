"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const STEPS = [
  {
    n: 1,
    label: "Konfiguracja",
    detail:
      "W konfiguratorze wybierasz kolory, rozmiar i ewentualne napisy albo pliki. Te ustawienia są podstawą do przygotowania projektu pod Twoje zamówienie.",
  },
  {
    n: 2,
    label: "Projekt i akceptacja",
    detail:
      "Przygotowujemy wizualizację lub projekt do akceptacji. Po Twoim „tak” przekazujemy zlecenie na produkcję — wcześniej możesz poprosić o drobne korekty.",
  },
  {
    n: 3,
    label: "Produkcja",
    detail:
      "Wykonujemy tabliczkę z wybranej plexi: cięcie, grawer lub nadruk według specyfikacji. Przed kolejnym etapem sprawdzamy jakość wykonania.",
  },
  {
    n: 4,
    label: "Wysyłka",
    detail:
      "Gotowy produkt bezpiecznie pakujemy i przekazujemy kurierowi. Dostaniesz informację o nadaniu przesyłki.",
  },
] as const;

export function ProductFulfillmentStepper() {
  const [openStep, setOpenStep] = useState<number | null>(null);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-4 pb-1">
        <span className="h-px flex-1 bg-brand-300" />
        <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.2em] text-brand-700 sm:text-sm">
          Proces realizacji
        </span>
        <span className="h-px flex-1 bg-brand-300" />
      </div>

      <nav aria-label="Proces realizacji zamówienia">
        <ol className="m-0 list-none space-y-1 p-0">
          {STEPS.map((step) => {
            const expanded = openStep === step.n;
            const panelId = `proces-etap-${step.n}`;
            const triggerId = `proces-etap-trigger-${step.n}`;

            return (
              <li key={step.n}>
                <button
                  type="button"
                  id={triggerId}
                  onClick={() =>
                    setOpenStep((prev) => (prev === step.n ? null : step.n))
                  }
                  className="flex w-full items-center gap-2.5 py-1.5 text-left"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-700 text-[10px] font-semibold text-white sm:text-[11px]">
                    {step.n}
                  </span>
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.15em] text-brand-700">
                    {step.label}
                  </span>
                  <span className="h-px flex-1 bg-brand-300" aria-hidden />
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-brand-500 transition-transform duration-200 ${
                      expanded ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>

                <div
                  className={`grid transition-all duration-200 ease-in-out ${
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      className="max-w-prose pb-2 pl-8 pt-0.5 sm:pl-9"
                    >
                      <p className="text-xs leading-relaxed text-brand-600">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
