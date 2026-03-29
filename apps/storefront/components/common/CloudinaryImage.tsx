import Image from "next/image";
import { cloudinaryLoader, getCloudinaryBlurPlaceholder } from "@/lib/cloudinary/utils";

interface CloudinaryImageProps {
  publicId: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

export function CloudinaryImage({
  publicId,
  alt,
  width,
  height,
  priority = false,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: CloudinaryImageProps) {
  const isCloudinaryUrl = publicId.startsWith("http");

  if (isCloudinaryUrl) {
    return (
      <Image
        src={publicId}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={className}
        sizes={sizes}
      />
    );
  }

  return (
    <Image
      loader={cloudinaryLoader}
      src={publicId}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      sizes={sizes}
      placeholder="blur"
      blurDataURL={getCloudinaryBlurPlaceholder(publicId)}
    />
  );
}
