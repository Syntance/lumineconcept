import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.SANITY_API_TOKEN) {
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

    if (body._type === "landingPage") {
      if (body.slug?.current) {
        revalidatePath(`/${body.slug.current}`);
      }
    }

    if (body._type === "testimonial" || body._type === "siteSettings") {
      revalidatePath("/");
    }

    revalidateTag("sanity");

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    return NextResponse.json(
      { message: "Error revalidating", error: String(error) },
      { status: 500 },
    );
  }
}
