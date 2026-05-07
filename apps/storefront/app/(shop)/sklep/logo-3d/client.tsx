"use client";

import { useState } from "react";
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { trackFormStart, trackFormSubmit } from "@/lib/analytics/events";

const NOTES_LIMIT = 180;

type Status = "idle" | "loading" | "success" | "error";

const INPUT_CLASS =
  "w-full rounded-none border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-900 outline-none transition-colors placeholder:text-brand-400 focus:border-accent focus:ring-1 focus:ring-accent";

const LABEL_CLASS = "block text-sm font-medium text-brand-700 mb-1.5";

export function TablicaZLogoFormClient() {
  const [size, setSize] = useState("");
  const [shape, setShape] = useState("");
  const [led, setLed] = useState(false);
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [fileName, setFileName] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileName(f ? f.name : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    trackFormSubmit("tablica_z_logo");

    /**
     * Łączymy pola formularza w jedną wiadomość — `/api/contact` to generic
     * endpoint kontaktowy. Dla nazwy nadawcy bierzemy lokalną część e-maila,
     * żeby nie dodawać kolejnego pola w UI.
     */
    const derivedName = email.split("@")[0]?.slice(0, 80) || "Tablica z logo — wycena";
    const message = [
      "Zapytanie o wycenę: Tablica z logo",
      "",
      `Rozmiar: ${size || "—"}`,
      `Kształt: ${shape || "—"}`,
      `Podświetlenie LED: ${led ? "tak" : "nie"}`,
      fileName ? `Plik (nazwa, do dosłania): ${fileName}` : null,
      "",
      "Uwagi:",
      notes || "—",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: derivedName,
          email,
          message,
          website: honeypot,
        }),
      });
      const data = (await response.json()) as { success: boolean; message: string };

      if (data.success) {
        setStatus("success");
        setFeedback(data.message);
        setSize("");
        setShape("");
        setLed(false);
        setNotes("");
        setEmail("");
        setFileName("");
      } else {
        setStatus("error");
        setFeedback(data.message);
      }
    } catch {
      setStatus("error");
      setFeedback("Wystąpił błąd sieci. Spróbuj ponownie.");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-start gap-3 border border-green-200 bg-green-50 px-5 py-6 text-green-800">
        <CheckCircle className="h-8 w-8" aria-hidden />
        <p className="text-base font-medium">{feedback}</p>
        <p className="text-sm text-green-700">
          Jeśli przygotowałeś plik z logo, prześlij go w odpowiedzi na maila —
          potwierdzimy wycenę.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-5">
      {/* Plik z logo */}
      <div>
        <label htmlFor="logo-file" className={LABEL_CLASS}>
          Wgraj swoje logo lub elementy graficzne
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="logo-file"
            className="inline-flex cursor-pointer items-center gap-2 border border-brand-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-800 transition-colors hover:bg-brand-100"
          >
            <Upload className="h-4 w-4" aria-hidden />
            Wybierz plik
          </label>
          <span className="text-sm text-brand-600">
            {fileName || "Nie wybrano żadnego pliku"}
          </span>
          <input
            id="logo-file"
            type="file"
            accept=".png,.svg,.ai,.pdf,.jpg,.jpeg"
            onChange={handleFileChange}
            onFocus={() => trackFormStart("tablica_z_logo")}
            className="sr-only"
          />
        </div>
        <p className="mt-2 text-xs text-brand-500">
          PNG, SVG, AI, PDF — max 10 MB. Plik możesz też przesłać mailem po
          wysłaniu zapytania.
        </p>
      </div>

      {/* Rozmiar / Kształt */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="logo-size" className={LABEL_CLASS}>
            Rozmiar
          </label>
          <input
            id="logo-size"
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            onFocus={() => trackFormStart("tablica_z_logo")}
            placeholder="np. 60 × 40 cm"
            maxLength={80}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="logo-shape" className={LABEL_CLASS}>
            Kształt
          </label>
          <input
            id="logo-shape"
            type="text"
            value={shape}
            onChange={(e) => setShape(e.target.value)}
            placeholder="np. okrągły, prostokątny, według logo"
            maxLength={80}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* LED */}
      <div>
        <span className={LABEL_CLASS}>LED</span>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-brand-800">
          <input
            type="checkbox"
            checked={led}
            onChange={(e) => setLed(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-accent"
          />
          Podświetlenie LED
        </label>
      </div>

      {/* Notatki */}
      <div>
        <label htmlFor="logo-notes" className={LABEL_CLASS}>
          W uwagach prosimy o wpisanie treści, która ma być zawarta na przedmiocie
        </label>
        <textarea
          id="logo-notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, NOTES_LIMIT))}
          maxLength={NOTES_LIMIT}
          className={`${INPUT_CLASS} resize-y`}
        />
        <p className="mt-1 text-right text-xs text-brand-500">
          {notes.length} / {NOTES_LIMIT}
        </p>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="logo-email" className={LABEL_CLASS}>
          Adres e-mail <span className="text-red-500">*</span>
        </label>
        <input
          id="logo-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          className={INPUT_CLASS}
        />
      </div>

      {/* Honeypot */}
      <div
        className="pointer-events-none absolute top-0 left-0 h-px w-px overflow-hidden opacity-0"
        aria-hidden
      >
        <label htmlFor="logo-website">Strona www</label>
        <input
          id="logo-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <p className="text-xs text-brand-500">
        Czas realizacji zamówienia to około 10 dni lub 2–3 dni z opcją ekspres.
      </p>

      {status === "error" && (
        <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{feedback}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex items-center justify-center bg-brand-800 px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-brand-900 disabled:opacity-50"
      >
        {status === "loading" ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-label="Wysyłanie" />
        ) : (
          "Wyślij zapytanie o wycenę"
        )}
      </button>
    </form>
  );
}
