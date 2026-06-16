import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AboutMediaBlockProps = {
  image: ReactNode;
  label?: ReactNode;
  labelPosition?: "above" | "below";
  className?: string;
};

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
        "m-0 flex w-full max-w-sm flex-col items-stretch sm:max-w-md",
        className,
      )}
    >
      {label && labelPosition === "above" ? (
        <div className={cn("mb-1 w-full shrink-0", LABEL_INSET_X)}>{label}</div>
      ) : null}

      <div className="w-full min-w-0 [&_img]:block [&_img]:h-auto [&_img]:w-full">
        {image}
      </div>

      {label && labelPosition === "below" ? (
        <div className={cn("mt-1 w-full shrink-0", LABEL_INSET_X)}>{label}</div>
      ) : null}
    </figure>
  );
}
