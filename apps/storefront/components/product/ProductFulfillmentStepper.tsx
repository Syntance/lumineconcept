const STEPS = [
  { n: 1, label: "Konfiguracja" },
  { n: 2, label: "Projekt i akceptacja" },
  { n: 3, label: "Produkcja" },
  { n: 4, label: "Wysyłka" },
] as const;

export function ProductFulfillmentStepper() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-4 pb-1">
        <span className="h-px flex-1 bg-brand-300" />
        <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.2em] text-brand-700 sm:text-sm">
          Proces realizacji
        </span>
        <span className="h-px flex-1 bg-brand-300" />
      </div>
      <nav
        aria-label="Proces realizacji zamówienia"
        className="flex flex-wrap items-stretch justify-center gap-x-0 gap-y-2 sm:justify-start"
      >
        {STEPS.map((step, i) => (
          <div key={step.n} className="flex items-center">
            {i > 0 && (
              <span
                className="mx-1 h-px w-3 shrink-0 bg-brand-300 sm:mx-1.5 sm:w-5"
                aria-hidden
              />
            )}
            <div className="flex min-w-0 items-center gap-2 rounded-sm border border-brand-200 bg-white/80 px-2 py-1.5 sm:px-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-700 text-[10px] font-semibold text-white sm:h-6 sm:w-6 sm:text-[11px]">
                {step.n}
              </span>
              <span className="text-[10px] font-medium leading-snug text-brand-800 sm:text-[11px]">
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
