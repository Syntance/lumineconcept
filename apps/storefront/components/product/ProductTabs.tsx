import { ProductFulfillmentStepper } from "@/components/product/ProductFulfillmentStepper";

interface ProductTabsProps {
  metadata: Record<string, unknown>;
}

/**
 * Sekcja pod konfiguratorem: specyfikacja (gdy jest w metadanych) + kroki realizacji.
 * Treść pola „Opis” z Medusy jest wyłącznie pod tytułem produktu — bez duplikatu tu.
 */
export function ProductTabs({ metadata }: ProductTabsProps) {
  const spec = metadata.specyfikacja as string | undefined;
  const tabs: Array<{ title: string; content: React.ReactNode }> = [];

  if (spec) {
    tabs.push({
      title: "Specyfikacja",
      content: (
        <div className="prose prose-base max-w-none text-brand-700">
          <p>{spec}</p>
        </div>
      ),
    });
  }

  return (
    <div className="space-y-6">
      {tabs.map((tab, i) => (
        <details key={tab.title} className="group" open={i === 0}>
          <summary className="cursor-pointer list-none border-b border-brand-200 pb-3 text-base font-medium text-brand-500 transition-colors group-open:text-brand-900 [&::-webkit-details-marker]:hidden">
            {tab.title}
          </summary>
          <div className="pt-4">{tab.content}</div>
        </details>
      ))}
      <div className={tabs.length > 0 ? "mt-10" : ""}>
        <ProductFulfillmentStepper />
      </div>
    </div>
  );
}
