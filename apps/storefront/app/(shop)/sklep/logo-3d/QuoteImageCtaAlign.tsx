"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

const LG_QUERY = "(min-width: 1024px)";

function anchorBottom(grid: HTMLElement): number | null {
  const submit = grid.querySelector<HTMLElement>('button[type="submit"]');
  if (submit) return submit.getBoundingClientRect().bottom;

  const form = grid.querySelector("form");
  if (form) return form.getBoundingClientRect().bottom;

  const rightCol = grid.children[1];
  return rightCol ? rightCol.getBoundingClientRect().bottom : null;
}

/**
 * Ustawia --logo3d-image-h na #formularz: od góry kolumny ze zdjęciem do spodu CTA.
 */
export function QuoteImageCtaAlign({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const grid = el.closest<HTMLElement>("#formularz");
    if (!grid) return;

    const mq = window.matchMedia(LG_QUERY);

    const sync = () => {
      if (!mq.matches) {
        grid.style.removeProperty("--logo3d-image-h");
        return;
      }

      const top = el.getBoundingClientRect().top;
      const bottom = anchorBottom(grid);
      if (bottom == null) return;

      grid.style.setProperty(
        "--logo3d-image-h",
        `${Math.max(0, Math.ceil(bottom - top))}px`,
      );
    };

    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(grid);
    const rightCol = grid.children[1];
    if (rightCol) ro.observe(rightCol);

    const form = grid.querySelector("form");
    if (form) ro.observe(form);

    const submit = grid.querySelector("button[type=submit]");
    if (submit) ro.observe(submit);

    const notes = grid.querySelector("textarea");
    if (notes) ro.observe(notes);

    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);

    return () => {
      ro.disconnect();
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
      grid.style.removeProperty("--logo3d-image-h");
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative z-2 flex min-h-0 w-full max-lg:mx-auto max-lg:max-w-md lg:sticky lg:top-[calc(var(--shop-chrome-h)+var(--product-gallery-sticky-gap))] lg:h-(--logo3d-image-h,auto) lg:self-start"
    >
      {children}
    </div>
  );
}
