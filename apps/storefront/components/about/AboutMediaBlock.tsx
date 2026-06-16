import type { ReactNode } from "react";

import { ABOUT_MEDIA_WIDTH_CLASS } from "@/components/about/about-media";
import { cn } from "@/lib/utils";
type AboutMediaBlockProps = {
  image: ReactNode;
  label?: ReactNode;
  labelPosition?: "above" | "below";
  className?: string;
};

/** Kompensacja alfa-marginesu w wyciętych webp (~6.5% wys.) — wizualny gap ≈ 1/3 poprzedniego. */
const LABEL_OVERLAP_BELOW = "-mt-[6.7%]" as const;
const LABEL_OVERLAP_ABOVE = "-mb-[6.7%]" as const;

/** Wycięte webp mają ~2.9% przezroczystego marginesu — etykieta dopasowana do widocznej treści. */
const LABEL_INSET_X = "px-[2.9%]" as const;

/** Zdjęcie + etykieta — wspólna szerokość kolumny flex (bez JS). */
export function AboutMediaBlock({
  image,
  label,
  labelPosition = "below",
  className,
}: AboutMediaBlockProps) {
  return (
    <figure
      className={cn(
        "m-0 flex w-full flex-col items-stretch",
        ABOUT_MEDIA_WIDTH_CLASS,
        className,
      )}
    >
      {label && labelPosition === "above" ? (
        <div className={cn(LABEL_OVERLAP_ABOVE, "w-full shrink-0", LABEL_INSET_X)}>{label}</div>
      ) : null}

      <div className="w-full min-w-0 [&_img]:block [&_img]:h-auto [&_img]:w-full">
        {image}
      </div>

      {label && labelPosition === "below" ? (
        <div className={cn(LABEL_OVERLAP_BELOW, "w-full shrink-0", LABEL_INSET_X)}>{label}</div>
      ) : null}
    </figure>
  );
}
