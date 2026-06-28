"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Ustawia na rodzicu <section> zmienną --logo3d-white-h (px): od góry sekcji do
 * dolnej krawędzi tytułu — pod pełnoszerokościowy biały pas (inset-x-0).
 */
export function QuoteTitleBandMeasure({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const section = el?.closest("section");
    if (!el || !section) return;

    const sync = () => {
      const s = section.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      section.style.setProperty(
        "--logo3d-white-h",
        `${Math.max(0, Math.ceil(b.bottom - s.top))}px`,
      );
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
