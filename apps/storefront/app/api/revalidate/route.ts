import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePathForRealizationGalleryDoc } from "@/lib/sanity/realization-gallery-doc-ids";

const REVALIDATE_SECRET = process.env.SANITY_REVALIDATE_SECRET;

/**
 * Webhook z Sanity → /api/revalidate.
 *
 * Strategia: każda zmiana w Sanity invaliduje globalny tag `sanity`,
 * a dodatkowo dla wybranych typów punktowo odświeża kluczowe ścieżki.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");

  if (!REVALIDATE_SECRET || secret !== REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      _type?: string;
      _id?: string;
      page?: string;
      category?: string;
      productHandle?: string;
    };

    if (body._type === "siteSettings") {
      revalidatePath("/", "layout");
    }

    if (body._type === "testimonial" || body._type === "faq") {
      // Mapowanie page → ścieżka jest wprost — używamy stabilnych slugów.
      const pageToPath: Record<string, string> = {
        home: "/",
        shop: "/sklep",
        "logo-3d": "/sklep/logo-3d",
        "gotowe-wzory": "/sklep/gotowe-wzory",
        "tla-do-tablic": "/sklep/tla-do-tablic",
        "tablice-cenowe": "/sklep/tablice-cenowe",
      };
      const target = body.page ? pageToPath[body.page] : null;
      if (target) revalidatePath(target);
    }

    if (body._type === "realizationGallery" && body._id) {
      const target = revalidatePathForRealizationGalleryDoc(body._id);
      if (target) revalidatePath(target);
    }

    if (body._type === "productFaq" && body.productHandle) {
      revalidatePath(`/sklep/gotowe-wzory/${body.productHandle}`);
      revalidatePath(`/sklep/logo-3d/${body.productHandle}`);
      revalidatePath(`/sklep/certyfikaty/${body.productHandle}`);
    }

    revalidateTag("sanity", "max");

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch {
    return NextResponse.json(
      { message: "Error revalidating" },
      { status: 500 },
    );
  }
}
