import type { CSSProperties, ReactNode } from "react";

/**
 * Kolumna nad hero — wewnętrz ma `container-type: inline-size` pod `--cta-fs`.
 * `cqw` w tym komponencie liczy się od kontenera `@container` przy obrazku w `HeroSection`
 * (wszystko skaluje liniowo z szerokością kadru grafiki, bez stałego capu rem/vmin).
 */
/** Szerokość panelu jako ułamek szerokości hero (~62% szerokości zdjęcia). */
const PANEL_WIDTH_PER_CENT = 62;

/** Współczynniki skali względem `--cta-fs` — jedna baza dla napisów i CTA (`fontSize`/padding przycisku w `em`). */
export const heroPanelScale = {
  /** Bazowy rozmiar względem szerokości kolumny; mniejsze = proporcjonalnie mniejsze wszystko */
  ctaOfPanel: 0.0167265,
  title: 65 / 14,
  subtitle: 20 / 14,
  body: 18 / 14,
  ctaPadX: 1.85,
  ctaPadY: 0.76,
  /** Mniejszy odstęp „od góry” kolumny — treść siedzi wyżej */
  padTop: 1.15,
  gapAfterTitle: 0.9 * 1.5,
  gapAfterSubtitle: 0.62 * 1.5,
  gapBeforeCta: 1.4,
  gapCtaStack: 1.1,
} as const;

export function HeroShadowPanel({
  align,
  children,
}: {
  align: "left" | "center";
  children: ReactNode;
}) {
  const columnWidthCss = `${PANEL_WIDTH_PER_CENT}cqw`;

  return (
    <div
      className={`flex max-h-full min-h-0 w-full shrink-0 flex-col overflow-y-auto overflow-x-hidden ${
        align === "center" ? "items-center justify-start px-[2.16cqw]" : "items-start justify-start"
      }`}
    >
      <div
        className="max-w-[min(100cqw,100%)] shrink-0"
        style={{
          width: columnWidthCss,
          ...(align === "center" ? { marginLeft: "auto", marginRight: "auto" } : {}),
        }}
      >
        <div
          className="relative z-10 box-border flex flex-col overflow-visible text-left"
          style={
            {
              containerType: "inline-size",
              containerName: "hero-panel",
              width: "100%",
              "--cta-fs": `calc(100cqw * ${heroPanelScale.ctaOfPanel})`,
              paddingTop: `calc(var(--cta-fs) * ${heroPanelScale.padTop} + 100cqw * ${1.08 / PANEL_WIDTH_PER_CENT})`,
              paddingBottom: `calc(var(--cta-fs) * 0.65)`,
            } as CSSProperties
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
