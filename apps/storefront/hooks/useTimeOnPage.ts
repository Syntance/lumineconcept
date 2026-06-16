"use client";

/**
 * Notion "PostHog i eventy → time_on_page".
 *
 * Liczymy tylko czas aktywny (tab widoczny). Wysyłamy przy:
 *  - `visibilitychange → hidden`
 *  - `pagehide` (mobile Safari nie odpala beforeunload)
 *  - zmianie `pagePath` (SPA nawigacja)
 *
 * Bez logowania krótkich sesji (<2s) — to z reguły bot lub przypadkowy klik.
 */
import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/track";

const MIN_SECONDS = 2;

export function useTimeOnPage(pagePath: string): void {
  const accumulatedRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const flushedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    accumulatedRef.current = 0;
    flushedRef.current = false;
    segmentStartRef.current =
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? performance.now()
        : null;

    const flush = () => {
      if (flushedRef.current) return;
      let total = accumulatedRef.current;
      if (segmentStartRef.current !== null) {
        total += (performance.now() - segmentStartRef.current) / 1000;
        segmentStartRef.current = null;
      }
      if (total >= MIN_SECONDS) {
        track("time_on_page", { seconds: Math.round(total) });
      }
      flushedRef.current = true;
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (segmentStartRef.current !== null) {
          accumulatedRef.current +=
            (performance.now() - segmentStartRef.current) / 1000;
          segmentStartRef.current = null;
        }
        // Hidden ≠ unmount — wysyłamy snapshot, ale nie blokujemy ponownego
        // pomiaru gdy użytkownik wróci na kartę.
        if (accumulatedRef.current >= MIN_SECONDS && !flushedRef.current) {
          track("time_on_page", {
            seconds: Math.round(accumulatedRef.current),
          });
          flushedRef.current = true;
        }
      } else if (document.visibilityState === "visible") {
        segmentStartRef.current = performance.now();
        flushedRef.current = false;
      }
    };

    const onPageHide = () => flush();
    const onBeforeUnload = () => flush();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [pagePath]);
}
