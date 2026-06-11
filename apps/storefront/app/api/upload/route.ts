import { NextResponse } from "next/server";
import { uploadProductFile } from "@/lib/product-upload/product-file";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    }

    const result = await uploadProductFile(file);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (
      message.includes("Plik jest za duży") ||
      message.includes("Niedozwolony typ pliku")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message === "MEDUSA_UPLOAD_UNAVAILABLE") {
      return NextResponse.json(
        {
          error:
            "Upload plików jest chwilowo niedostępny. Napisz na kontakt@lumineconcept.pl z załącznikiem po złożeniu zamówienia.",
        },
        { status: 503 },
      );
    }

    console.error("[upload] Error:", err);
    return NextResponse.json(
      { error: "Błąd podczas przesyłania pliku. Spróbuj ponownie." },
      { status: 500 },
    );
  }
}
