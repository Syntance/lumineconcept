"use client";

/**
 * Notion "PostHog i eventy → scroll_to_section".
 *
 * Lista anchorów wzięta wprost z dokumentu — patrz `SECTION_IDS`. Hook
 * wywołujemy globalnie (AnalyticsEffects), bo te same identyfikatory pojawiają
 * się na wielu podstronach i pojedyncze komponenty same nie wiedzą, czy
 * sekcja istnieje.
 *
 * Każdy event raz per sekcja per ścieżka. Próg widoczności 30% — żeby user,
 * który tylko mignął przez sekcję podczas szybkiego scrolla, jej "nie zliczył".
 */
import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

const SECTION_IDS = [
  "formularz",
  "cennik",
  "galeria",
  "opinie",
  "faq",
  "warianty",
  "proces",
  "ROI",
  "konfigurator",
  "kontakt",
] as const;

export function useScrollToSection(pagePath: string): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") return;

    const fired = new Set<string>();
    const observers: IntersectionObserver[] = [];

    // Czekamy na pierwszy paint dynamicznych sekcji — anchory pojawiają się
    // po hydratacji RSC.
    const handle = window.setTimeout(() => {
      SECTION_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              if (fired.has(id)) return;
              fired.add(id);
              track("section_view", { section: id });
            });
          },
          { threshold: 0.3 },
        );
        observer.observe(el);
        observers.push(observer);
      });
    }, 200);

    return () => {
      window.clearTimeout(handle);
      observers.forEach((o) => o.disconnect());
    };
  }, [pagePath]);
}
