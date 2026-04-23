import { PDP_MATERIAL_ACRYLIC } from "@/lib/product-pdp-copy";
import { ProductFulfillmentStepper } from "@/components/product/ProductFulfillmentStepper";
import {
  extractDimensionsFromProductDescription,
  getProductDimensionParts,
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
  const dimensionsLine = m[1]!.trim();
  if (!lead) return { lead: raw, dimensionsLine: null };
  return { lead, dimensionsLine };
}

export function ProductTabs({ description, metadata }: ProductTabsProps) {
  const spec = metadata.specyfikacja as string | undefined;
  const tabs: Array<{ title: string; content: React.ReactNode }> = [];

  const dimensionParts = getProductDimensionParts(metadata, null);
  const materialDescriptionLine =
    dimensionParts.thickness &&
    `${PDP_MATERIAL_ACRYLIC} ${dimensionParts.thickness} grubości`;

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
                <span className="font-bold text-brand-800">Wymiary:</span>{" "}
                {split.dimensionsLine.replace(/^Wymiary\s*[:\-–—]\s*/i, "").trim()}
              </p>
              {materialDescriptionLine && (
                <p className="mt-1">
                  <span className="font-bold text-brand-800">Materiał:</span>{" "}
                  {materialDescriptionLine}
                </p>
              )}
            </>
          ) : (
            <>
              {dimensionsInOpis && (
                <p className="mb-3 font-sans text-base leading-relaxed text-brand-700">
                  <span className="font-bold text-brand-800">Wymiary:</span> {dimensionsInOpis}
                </p>
              )}
              {materialDescriptionLine && (
                <p className="mb-3 font-sans text-base leading-relaxed text-brand-700">
                  <span className="font-bold text-brand-800">Materiał:</span>{" "}
                  {materialDescriptionLine}
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

  if (tabs.length === 0) return null;

  const hasOpisTab = tabs.some((t) => t.title === "Opis");

  return (
    <div className="space-y-6">
      {tabs.map((tab, i) => (
        <details key={tab.title} className="group" open={i === 0}>
          <summary className="cursor-pointer list-none border-b border-brand-200 pb-3 text-base font-medium text-brand-500 group-open:text-brand-900 transition-colors [&::-webkit-details-marker]:hidden">
            {tab.title}
          </summary>
          <div className="pt-4">
            {tab.content}
            {tab.title === "Opis" && (
              <div className="mt-10">
                <ProductFulfillmentStepper />
              </div>
            )}
          </div>
        </details>
      ))}
      {!hasOpisTab && (
        <div className="mt-10">
          <ProductFulfillmentStepper />
        </div>
      )}
    </div>
  );
}
