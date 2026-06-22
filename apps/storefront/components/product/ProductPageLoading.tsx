import { Loader2 } from "lucide-react";

type PageLoadingScreenProps = {
  ariaLabel?: string;
};

/** Krem ze spinnerem — opcjonalnie importowany w miejscach poza App Router loading.tsx. */
export function PageLoadingScreen({
  ariaLabel = "Ładowanie",
}: PageLoadingScreenProps) {
  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-brand-50"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <Loader2
        className="h-10 w-10 animate-spin text-brand-700 motion-reduce:animate-none"
        aria-hidden
      />
    </div>
  );
}

/** @deprecated Użyj PageLoadingScreen — alias dla stron produktu. */
export function ProductPageLoading() {
  return <PageLoadingScreen ariaLabel="Ładowanie produktu" />;
}
