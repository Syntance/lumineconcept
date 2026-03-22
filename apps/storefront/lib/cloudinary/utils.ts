const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const RESPONSIVE_BREAKPOINTS = [400, 800, 1200, 1600];

export function getCloudinaryUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
    crop?: string;
  },
): string {
  const transforms = [
    `f_${options?.format ?? "auto"}`,
    `q_${options?.quality ?? "auto"}`,
    options?.width ? `w_${options.width}` : null,
    options?.height ? `h_${options.height}` : null,
    options?.crop ? `c_${options.crop}` : null,
  ]
    .filter(Boolean)
    .join(",");

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}

export function getCloudinarySrcSet(publicId: string): string {
  return RESPONSIVE_BREAKPOINTS.map(
    (w) => `${getCloudinaryUrl(publicId, { width: w })} ${w}w`,
  ).join(", ");
}

export function getCloudinaryBlurPlaceholder(publicId: string): string {
  return getCloudinaryUrl(publicId, {
    width: 20,
    quality: "30",
    format: "webp",
  });
}

export function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  return getCloudinaryUrl(src, {
    width,
    quality: String(quality ?? 75),
  });
}
