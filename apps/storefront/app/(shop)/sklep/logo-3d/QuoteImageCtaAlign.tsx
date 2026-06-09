"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const LG_QUERY = "(min-width: 1024px)";

const STICKY_TOP_CLASS =
  "lg:top-[calc(var(--shop-chrome-h)+var(--product-gallery-sticky-gap)+env(safe-area-inset-top,0px))]";

/** Proporcje źródła PNG. */
const IMAGE_ASPECT = 915 / 693;
const IMAGE_WIDTH_RATIO = 0.88;

function getViewportImageCap(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;pointer-events:none;height:calc(100svh - var(--shop-chrome-h) - var(--product-gallery-sticky-gap) - 2rem - env(safe-area-inset-bottom,0px))";
  document.body.appendChild(probe);
  const cap = probe.getBoundingClientRect().height;
  probe.remove();
  return cap;
}

function anchorBottom(grid: HTMLElement): number | null {
  const submit = grid.querySelector<HTMLElement>('button[type="submit"]');
  if (submit) return submit.getBoundingClientRect().bottom;

  const form = grid.querySelector("form");
  if (form) return form.getBoundingClientRect().bottom;

  const rightCol = grid.children[1];
  return rightCol ? rightCol.getBoundingClientRect().bottom : null;
}

function computeLayout(
  columnWidth: number,
  spanHeight: number,
  viewportCap: number,
): { width: number; height: number; reduced: boolean } {
  if (columnWidth <= 0 || spanHeight <= 0) {
    return { width: 0, height: 0, reduced: false };
  }

  const naturalWidth = columnWidth * IMAGE_WIDTH_RATIO;
  const naturalHeight = naturalWidth * IMAGE_ASPECT;

  if (naturalHeight >= spanHeight - 2) {
    const height = spanHeight;
    const width = Math.min(columnWidth, height / IMAGE_ASPECT);
    return { width, height, reduced: false };
  }

  let width = naturalWidth;
  let height = naturalHeight;

  if (height > viewportCap) {
    height = viewportCap;
    width = height / IMAGE_ASPECT;
  }

  return { width, height, reduced: true };
}

/** Odstęp lewo zdjęcia = odstęp zdjęcie→napisy (z uwzgl. column-gap siatki). */
function computeImageMarginLeft(
  columnWidth: number,
  imageWidth: number,
  columnGap: number,
  reduced: boolean,
): number {
  const freeSpace = Math.max(0, columnWidth - imageWidth);
  if (freeSpace <= 0) return 0;

  if (reduced) {
    const ml = (freeSpace + columnGap) / 2;
    return Math.min(ml, freeSpace);
  }

  return freeSpace / 2;
}

function readColumnGap(grid: HTMLElement): number {
  const raw = getComputedStyle(grid).columnGap;
  const px = parseFloat(raw);
  return Number.isFinite(px) ? px : 80;
}

/**
 * Desktop: pełne zdjęcie (nagłówek → CTA) albo zmniejszone (proporcje, sticky, wyśrodkowane).
 */
export function QuoteImageCtaAlign({ children }: { children: ReactNode }) {
  const columnRef = useRef<HTMLDivElement>(null);
  const [isReduced, setIsReduced] = useState(false);

  useLayoutEffect(() => {
    const column = columnRef.current;
    if (!column) return;

    const grid = column.closest<HTMLElement>("#formularz");
    if (!grid) return;

    const mq = window.matchMedia(LG_QUERY);

    const sync = () => {
      if (!mq.matches) {
        setIsReduced(false);
        grid.style.removeProperty("--logo3d-image-h");
        grid.style.removeProperty("--logo3d-image-w");
        grid.style.removeProperty("--logo3d-image-max-h");
        grid.style.removeProperty("--logo3d-image-ml");
        return;
      }

      const title = grid.querySelector<HTMLElement>("#logo3d-quote-title");
      const ctaBottom = anchorBottom(grid);
      if (ctaBottom == null) return;

      const columnTop = column.getBoundingClientRect().top;
      const titleTop = title?.getBoundingClientRect().top ?? columnTop;
      const spanHeight = Math.max(0, ctaBottom - titleTop);
      const columnSpan = Math.max(0, ctaBottom - columnTop);

      const { width, height, reduced } = computeLayout(
        column.clientWidth,
        spanHeight,
        getViewportImageCap(),
      );

      setIsReduced(reduced);

      const marginLeft = computeImageMarginLeft(
        column.clientWidth,
        width,
        readColumnGap(grid),
        reduced,
      );

      grid.style.setProperty("--logo3d-image-max-h", `${Math.ceil(columnSpan)}px`);
      grid.style.setProperty("--logo3d-image-w", `${Math.ceil(width)}px`);
      grid.style.setProperty("--logo3d-image-h", `${Math.ceil(height)}px`);
      grid.style.setProperty("--logo3d-image-ml", `${Math.ceil(marginLeft)}px`);
    };

    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(grid);
    ro.observe(column);
    const rightCol = grid.children[1];
    if (rightCol) ro.observe(rightCol);

    const title = grid.querySelector<HTMLElement>("#logo3d-quote-title");
    if (title) ro.observe(title);

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
      grid.style.removeProperty("--logo3d-image-w");
      grid.style.removeProperty("--logo3d-image-max-h");
      grid.style.removeProperty("--logo3d-image-ml");
    };
  }, []);

  return (
    <div
      ref={columnRef}
      className="relative z-2 w-full max-lg:mx-auto max-lg:max-w-md lg:min-h-(--logo3d-image-max-h,auto) lg:self-stretch"
    >
      <div
        className={cn(
          "lg:z-2 lg:ml-(--logo3d-image-ml,auto) lg:mr-auto lg:w-fit",
          isReduced && ["lg:sticky", STICKY_TOP_CLASS],
        )}
      >
        {children}
      </div>
    </div>
  );
}
