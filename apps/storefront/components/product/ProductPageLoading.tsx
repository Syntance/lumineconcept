import { Loader2 } from "lucide-react";

/** Stan ładowania PDP — jednolity krem zamiast skeletonu. */
export function ProductPageLoading() {
  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-brand-50"
      role="status"
      aria-live="polite"
      aria-label="Ładowanie produktu"
    >
      <Loader2
        className="h-10 w-10 animate-spin text-brand-700 motion-reduce:animate-none"
        aria-hidden
      />
    </div>
  );
}
