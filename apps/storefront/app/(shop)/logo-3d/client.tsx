"use client";

import { useState } from "react";
import { Upload, Loader2, CheckCircle } from "lucide-react";
import { trackFormStart, trackFormSubmit } from "@/lib/analytics/events";

export function Logo3DFormClient() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    trackFormSubmit("logo_3d");

    // TODO: Implement form submission to backend
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setStatus("success");
  };

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-4 font-display text-xl font-semibold text-brand-900">
          Dziękujemy!
        </h2>
        <p className="mt-2 text-brand-600">
          Otrzymaliśmy Twoje zgłoszenie. Odezwiemy się w ciągu 24 godzin z wyceną
          i wizualizacją.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-brand-700 mb-1">
            Imię i nazwisko
          </label>
          <input
            id="name"
            type="text"
            required
            onFocus={() => trackFormStart("logo_3d")}
            className="w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-brand-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-brand-700 mb-1">
          Telefon (opcjonalnie)
        </label>
        <input
          id="phone"
          type="tel"
          className="w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
        />
      </div>

      <div>
        <label htmlFor="logo-file" className="block text-sm font-medium text-brand-700 mb-1">
          Plik z logo
        </label>
        <div className="relative rounded-lg border-2 border-dashed border-brand-200 p-8 text-center hover:border-accent transition-colors">
          <Upload className="mx-auto h-8 w-8 text-brand-400" />
          <p className="mt-2 text-sm text-brand-600">
            Przeciągnij plik lub kliknij, aby wybrać
          </p>
          <p className="text-xs text-brand-400 mt-1">
            PNG, SVG, AI, PDF — max 10 MB
          </p>
          <input
            id="logo-file"
            type="file"
            accept=".png,.svg,.ai,.pdf,.jpg,.jpeg"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      <div>
        <label htmlFor="dimensions" className="block text-sm font-medium text-brand-700 mb-1">
          Oczekiwane wymiary (cm)
        </label>
        <input
          id="dimensions"
          type="text"
          placeholder="np. 60 x 40 cm"
          className="w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-brand-700 mb-1">
          Dodatkowe uwagi
        </label>
        <textarea
          id="notes"
          rows={4}
          className="w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none"
          placeholder="Np. preferowany kolor podświetlenia, materiał, sposób montażu..."
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-md bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark transition-colors disabled:opacity-50"
      >
        {status === "loading" ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        ) : (
          "Wyślij zapytanie"
        )}
      </button>
    </form>
  );
}
