import type { ReactNode } from "react";

import {
  ABOUT_MEDIA_LABEL_INSET_X,
  ABOUT_MEDIA_LABEL_OVERLAP_ABOVE,
  ABOUT_MEDIA_LABEL_OVERLAP_BELOW,
  ABOUT_MEDIA_WIDTH_CLASS,
} from "@/components/about/about-media";
import { cn } from "@/lib/utils";
type AboutMediaBlockProps = {
  image: ReactNode;
  label?: ReactNode;
  labelPosition?: "above" | "below";
  className?: string;
};

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
        <div className={cn(ABOUT_MEDIA_LABEL_OVERLAP_ABOVE, "w-full shrink-0", ABOUT_MEDIA_LABEL_INSET_X)}>
          {label}
        </div>
      ) : null}

      <div className="w-full min-w-0 [&_img]:block [&_img]:h-auto [&_img]:w-full">
        {image}
      </div>

      {label && labelPosition === "below" ? (
        <div className={cn(ABOUT_MEDIA_LABEL_OVERLAP_BELOW, "w-full shrink-0", ABOUT_MEDIA_LABEL_INSET_X)}>
          {label}
        </div>
      ) : null}
    </figure>
  );
}
