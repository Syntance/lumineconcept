"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAnalytics } from "@/lib/analytics/useAnalytics";
import { useFormTracking } from "@/hooks/useFormTracking";

const NOTES_LIMIT = 180;

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const MAX_ATTACHMENT_LABEL = "4 MB";

const DISALLOWED_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "com",
  "msi",
  "scr",
  "sh",
  "ps1",
  "vbs",
  "jar",
  "js",
  "mjs",
  "html",
  "htm",
  "php",
  "py",
  "rb",
]);

type Status = "idle" | "loading" | "success" | "error";

const INPUT_CLASS =
  "w-full rounded-none border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-900 outline-none transition-colors placeholder:text-brand-400 focus:border-accent focus:ring-1 focus:ring-accent";

const LABEL_CLASS = "block text-sm font-medium text-brand-700 mb-1.5";

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  if (i < 0 || i === name.length - 1) return "";
  return name.slice(i + 1).toLowerCase();
}

export function TablicaZLogoFormClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [size, setSize] = useState("");
  const [shape, setShape] = useState("");
  const [led, setLed] = useState(false);
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [fileName, setFileName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");
  const tracker = useFormTracking("logo3d_wycena");
  const { track, identifyLead } = useAnalytics();

  const resetFile = () => {
    setLogoFile(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFileError("");

    if (!f) {
      resetFile();
      return;
    }

    if (f.size > MAX_ATTACHMENT_BYTES) {
      setFileError(
        `Plik jest za duży (maks. ${MAX_ATTACHMENT_LABEL}). Większy plik prześlij mailem na kontakt@lumineconcept.pl po wysłaniu zapytania.`,
      );
      tracker.reportError("attachment", "size");
      resetFile();
      return;
    }

    if (DISALLOWED_EXTENSIONS.has(getExtension(f.name))) {
      setFileError("Ten typ pliku nie jest obsługiwany.");
      tracker.reportError("attachment", "format");
      resetFile();
      return;
    }

    setLogoFile(f);
    setFileName(f.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    if (email.trim()) {
      identifyLead({ email, source: "form_logo3d" });
    }
    track("lead_submit", {
      form_name: "logo3d_wycena",
      has_logo: !!logoFile,
      has_photo: false,
      led: led ? "bialy" : "bez",
      size: size?.trim() ? "custom" : "nie_wiem",
      express: /(eks|express)/i.test(notes),
    });

    const derivedName = email.split("@")[0]?.slice(0, 80) || "Tablica z logo — wycena";
    const message = [
      "Zapytanie o wycenę: Tablica z logo",
      "",
      `Rozmiar: ${size || "—"}`,
      `Kształt: ${shape || "—"}`,
      `Podświetlenie LED: ${led ? "tak" : "nie"}`,
      "",
      "Uwagi:",
      notes || "—",
    ].join("\n");

    try {
      const formData = new FormData();
      formData.set("name", derivedName);
      formData.set("email", email);
      formData.set("message", message);
      formData.set("form_preset", "logo3d");
      formData.set("website", honeypot);
      if (logoFile) {
        formData.set("attachment", logoFile, logoFile.name);
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { success: boolean; message: string };

      if (data.success) {
        setStatus("success");
        setFeedback(data.message);
        tracker.handleSubmitSuccess();
        setSize("");
        setShape("");
        setLed(false);
        setNotes("");
        setEmail("");
        resetFile();
      } else {
        setStatus("error");
        setFeedback(data.message);
        tracker.reportError("form", "server");
      }
    } catch {
      setStatus("error");
      setFeedback("Wystąpił błąd sieci. Spróbuj ponownie.");
      tracker.reportError("form", "server");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-start gap-3 border border-green-200 bg-green-50 px-5 py-6 text-green-800">
        <CheckCircle className="h-8 w-8" aria-hidden />
        <p className="text-base font-medium">{feedback}</p>
        <p className="text-sm text-green-700">
          Twój plik (jeśli dodany) trafił do nas razem z wiadomością.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-5">
      {/* Plik z logo */}
      <div>
        <label htmlFor="logo-file" className={LABEL_CLASS}>
          Wgraj swoje logo
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
            ref={fileInputRef}
            id="logo-file"
            type="file"
            onChange={handleFileChange}
            onFocus={tracker.handleFocus}
            onBlur={tracker.recordField("attachment")}
            className="sr-only"
          />
        </div>
        {fileError ? <p className="mt-2 text-xs text-red-600">{fileError}</p> : null}
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
            onFocus={tracker.handleFocus}
            onBlur={tracker.recordField("size")}
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
            onFocus={tracker.handleFocus}
            onBlur={tracker.recordField("shape")}
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
          W uwagach prosimy o wpisanie treści, która ma być zawarta na tablicy.
        </label>
        <textarea
          id="logo-notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, NOTES_LIMIT))}
          onFocus={tracker.handleFocus}
          onBlur={tracker.recordField("notes")}
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
          onFocus={tracker.handleFocus}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => {
            tracker.recordField("email")();
          }}
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
        Czas realizacji zamówienia to około 7-10 dni roboczych lub 2–3 dni z opcją express.
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
