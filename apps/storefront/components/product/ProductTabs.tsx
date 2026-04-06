import {
  extractDimensionsFromProductDescription,
  getProductDimensionsLabel,
  stripHtmlForDimensions,
} from "@/lib/products/dimensions";

interface ProductTabsProps {
  description: string | null;
  metadata: Record<string, unknown>;
}

/** „…3D. Wymiary: 23×25 cm” → osobny akapit pod pierwszym zdaniem. */
function splitDescriptionLeadAndDimensions(raw: string): {
  lead: string;
  dimensionsLine: string | null;
} {
  const plain = stripHtmlForDimensions(raw).replace(/\s+/g, " ").trim();
  if (!plain) return { lead: raw, dimensionsLine: null };
  const m = plain.match(/\b(Wymiary\s*[:\-–—]\s*.+)$/i);
  if (!m || m.index === undefined || m.index === 0) {
    return { lead: raw, dimensionsLine: null };
  }
  const lead = plain.slice(0, m.index).trim();
  const dimensionsLine = m[1].trim();
  if (!lead) return { lead: raw, dimensionsLine: null };
  return { lead, dimensionsLine };
}

export function ProductTabs({ description, metadata }: ProductTabsProps) {
  const spec = metadata.specyfikacja as string | undefined;
  const tabs: Array<{ title: string; content: React.ReactNode }> = [];

  const dimensionsInOpis =
    getProductDimensionsLabel(metadata) ??
    extractDimensionsFromProductDescription(
      description ?? undefined,
      typeof spec === "string" ? spec : undefined,
    );

  const split = description ? splitDescriptionLeadAndDimensions(description) : null;

  if (description) {
    tabs.push({
      title: "Opis",
      content: (
        <div className="prose prose-base text-brand-700 max-w-none">
          {split?.dimensionsLine ? (
            <>
              <p>{split.lead}</p>
              <p className="mt-1">
                <span className="text-brand-500">Wymiary:</span>{" "}
                {split.dimensionsLine.replace(/^Wymiary\s*[:\-–—]\s*/i, "").trim()}
              </p>
            </>
          ) : (
            <>
              {dimensionsInOpis && (
                <p className="mb-3 font-sans text-base leading-relaxed text-brand-700">
                  <span className="text-brand-500">Wymiary:</span> {dimensionsInOpis}
                </p>
              )}
              <p>{description}</p>
            </>
          )}
        </div>
      ),
    });
  }

  if (spec) {
    tabs.push({
      title: "Specyfikacja",
      content: <div className="prose prose-base text-brand-700 max-w-none"><p>{spec}</p></div>,
    });
  }

  tabs.push({
    title: "Czas realizacji i wysyłka",
    content: (
      <div className="space-y-3 text-base text-brand-700">
        <p>Czas realizacji zamówienia: <strong>około 10 dni roboczych</strong></p>
        <p>
          <strong>Kurier DPD</strong> — przesyłka kurierska dostarczona pod wskazany adres, koszt od{" "}
          <strong>25 zł</strong>.
        </p>
      </div>
    ),
  });

  return (
    <div className="space-y-6">
      {tabs.map((tab, i) => (
        <details key={tab.title} className="group" open={i === 0}>
          <summary className="cursor-pointer border-b border-brand-200 pb-3 text-base font-medium text-brand-500 group-open:text-brand-900 transition-colors">
            {tab.title}
          </summary>
          <div className="pt-4">{tab.content}</div>
        </details>
      ))}
    </div>
  );
}
