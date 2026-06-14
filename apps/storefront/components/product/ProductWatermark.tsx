import { cn } from "@/lib/utils";

const WATERMARK_MASK = "url(/images/watermark.png)";

/** Kolor znaku wodnego na zdjęciach produktów (krem marki). */
const WATERMARK_COLOR = "#F9EFE2";

const WATERMARK_SHADOW =
  "drop-shadow(0 1px 2px rgb(0 0 0 / 0.55)) drop-shadow(0 0 1px rgb(0 0 0 / 0.75))";

type ProductWatermarkProps = {
  className?: string;
};

export function ProductWatermark({ className }: ProductWatermarkProps) {
  return (
    <div
      aria-hidden
      className={cn("block max-w-none", className)}
      style={{
        backgroundColor: WATERMARK_COLOR,
        WebkitMaskImage: WATERMARK_MASK,
        maskImage: WATERMARK_MASK,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        filter: WATERMARK_SHADOW,
      }}
    />
  );
}
