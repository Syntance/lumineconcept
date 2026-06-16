import Image from "next/image";

import { ABOUT_MEDIA_WIDTH_CLASS } from "@/components/about/about-media";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";
import { cn } from "@/lib/utils";

type AboutCutoutImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
};

/** Obraz z gotowym wyciętym kształtem (alfa) — bez ramki, tła i border-radius. */
export function AboutArchImage({
  src,
  alt,
  priority = false,
  className,
}: AboutCutoutImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={720}
      height={960}
      priority={priority}
      fetchPriority={priority ? "high" : undefined}
      sizes="(max-width: 768px) 85vw, (max-width: 1280px) 40vw, 22.68rem"
      quality={92}
      unoptimized={isCmsImageUnoptimized(src)}
      className={cn("block h-auto w-full", ABOUT_MEDIA_WIDTH_CLASS, className)}
      draggable={false}
    />
  );
}
