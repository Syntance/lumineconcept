"use client";

import { useLayoutEffect } from "react";

const DESKTOP_MQ = "(min-width: 1024px)";

/**
 * Prod soft-nav: zanim `<img>` wyśle request, dogrzewamy cache na desktopie.
 * Na dev lokalny dysk maskuje problem; na Vercel sieć + hydracja dają widoczną lukę.
 */
export function HeroDesktopImageWarmup({ src }: { src: string }) {
  useLayoutEffect(() => {
    if (!window.matchMedia(DESKTOP_MQ).matches) return;
    const probe = new window.Image();
    probe.decoding = "async";
    probe.src = src;
  }, [src]);

  return null;
}
