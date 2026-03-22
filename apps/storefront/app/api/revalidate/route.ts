import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

const REVALIDATE_SECRET = process.env.SANITY_REVALIDATE_SECRET;

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");

  if (!REVALIDATE_SECRET || secret !== REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      _type?: string;
      slug?: { current?: string };
    };

    if (body._type === "blogPost") {
      revalidatePath("/blog");
      if (body.slug?.current) {
        revalidatePath(`/blog/${body.slug.current}`);
      }
    }

    if (body._type === "landingPage" || body._type === "page") {
      if (body.slug?.current) {
        revalidatePath(`/${body.slug.current}`);
      }
    }

    if (body._type === "testimonial" || body._type === "siteSettings") {
      revalidatePath("/");
    }

    if (body._type === "siteSettings") {
      revalidatePath("/", "layout");
    }

    revalidateTag("sanity", "max");

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    return NextResponse.json(
      { message: "Error revalidating", error: String(error) },
      { status: 500 },
    );
  }
}
