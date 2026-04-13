import { cn } from "@/lib/utils";

const STEPS = [
  {
    n: 1,
    label: "Konfiguracja i płatność",
    short:
      "Ustalasz kolory, treści oraz opłacasz zamówienie.",
  },
  {
    n: 2,
    label: "Wizualizacja",
    short: "Przygotowujemy wizualizację do Twojej akceptacji.",
  },
  {
    n: 3,
    label: "Produkcja",
    short:
      "Realizujemy zamówienie według zaakceptowanej wizualizacji.",
  },
  {
    n: 4,
    label: "Wysyłka",
    short:
      "Gotowy produkt bezpiecznie pakujemy i przekazujemy kurierowi.",
  },
] as const;

export function ProductFulfillmentStepper() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 pb-0.5">
        <span className="h-px flex-1 bg-brand-300" />
        <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.2em] text-brand-700 sm:text-sm">
          Proces realizacji
        </span>
        <span className="h-px flex-1 bg-brand-300" />
      </div>

      <nav aria-label="Proces realizacji zamówienia">
        <ol className="m-0 grid list-none grid-cols-1 gap-10 p-0 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4 lg:gap-0">
          {STEPS.map((step, index) => (
            <li
              key={step.n}
              className={cn(
                "flex flex-col items-center px-1 sm:px-2",
                index > 0 && "lg:border-l lg:border-brand-200 lg:pl-6",
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
                {step.n}
              </span>
              <span className="mt-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-brand-800">
                {step.label}
              </span>
              <p className="mt-3 w-full max-w-[20rem] text-left text-sm leading-relaxed text-brand-700 lg:max-w-none">
                {step.short}
              </p>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
