"use client";

/**
 * Notion "PostHog i eventy → scroll tracking".
 *
 * Wystawia "sentinele" (ukryte divy) na 25/50/75/100% wysokości dokumentu
 * i odpala `scroll_depth` raz per próg per ścieżka. Resetujemy stan przy
 * zmianie `pagePath` — Next.js App Router renderuje pomiędzy ścieżkami bez
 * unmounta layoutu, więc bez tego event nigdy by się nie powtórzył.
 *
 * Wybór `IntersectionObserver` zamiast `scroll` listenera: oszczędza CPU
 * (passive observer + brak debouncingu) i nie konfliktuje ze smooth scroll.
 */
import { useEffect } from "react";
import { trackScrollDepth } from "@/lib/analytics/events";

const THRESHOLDS: Array<25 | 50 | 75 | 100> = [25, 50, 75, 100];

export function useScrollDepth(pagePath: string): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") return;

    const fired = new Set<number>();
    const sentinels: HTMLElement[] = [];
    const observers: IntersectionObserver[] = [];

    THRESHOLDS.forEach((depth) => {
      const sentinel = document.createElement("div");
      sentinel.setAttribute("aria-hidden", "true");
      sentinel.dataset.scrollDepth = String(depth);
      sentinel.style.position = "absolute";
      sentinel.style.left = "0";
      sentinel.style.width = "1px";
      sentinel.style.height = "1px";
      sentinel.style.pointerEvents = "none";
      sentinel.style.top = `${depth}%`;
      // dołączamy do <body>, żeby `top: 25%` odnosiło się do wysokości viewportu
      // — `documentElement` nie ma offsetParent, więc % nie zadziała wszędzie tak samo.
      document.body.appendChild(sentinel);
      sentinels.push(sentinel);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            if (fired.has(depth)) return;
            fired.add(depth);
            trackScrollDepth(depth);
          });
        },
        { threshold: 0 },
      );
      observer.observe(sentinel);
      observers.push(observer);
    });

    return () => {
      observers.forEach((o) => o.disconnect());
      sentinels.forEach((s) => s.remove());
    };
  }, [pagePath]);
}
