"use client";

import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref = "/sklep" }: { fallbackHref?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
    >
      Wróć do poprzedniej strony
    </button>
  );
}
