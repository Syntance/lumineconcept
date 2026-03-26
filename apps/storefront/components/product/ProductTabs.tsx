interface ProductTabsProps {
  description: string | null;
  metadata: Record<string, unknown>;
}

export function ProductTabs({ description, metadata }: ProductTabsProps) {
  const spec = metadata.specyfikacja as string | undefined;
  const tabs: Array<{ title: string; content: React.ReactNode }> = [];

  if (description) {
    tabs.push({
      title: "Opis",
      content: <div className="prose prose-sm text-brand-700 max-w-none"><p>{description}</p></div>,
    });
  }

  if (spec) {
    tabs.push({
      title: "Specyfikacja",
      content: <div className="prose prose-sm text-brand-700 max-w-none"><p>{spec}</p></div>,
    });
  }

  tabs.push({
    title: "Wysyłka",
    content: (
      <div className="space-y-3 text-sm text-brand-700">
        <p>Realizacja zamówienia: <strong>1-3 dni robocze</strong></p>
        <p>Wysyłka kurierem InPost lub Paczkomaty 24/7.</p>
        <p>Darmowa wysyłka od 299 PLN.</p>
      </div>
    ),
  });

  tabs.push({
    title: "Zwroty",
    content: (
      <div className="space-y-3 text-sm text-brand-700">
        <p>Masz <strong>14 dni</strong> na zwrot produktu bez podawania przyczyny.</p>
        <p>Produkty personalizowane (na zamówienie) nie podlegają zwrotowi.</p>
      </div>
    ),
  });

  return (
    <div className="space-y-6">
      {tabs.map((tab, i) => (
        <details key={tab.title} className="group" open={i === 0}>
          <summary className="cursor-pointer border-b border-brand-200 pb-3 text-sm font-medium text-brand-500 group-open:text-brand-900 transition-colors">
            {tab.title}
          </summary>
          <div className="pt-4">{tab.content}</div>
        </details>
      ))}
    </div>
  );
}
