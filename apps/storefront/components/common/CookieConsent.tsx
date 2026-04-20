"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CONSENT_OPEN_EVENT,
  getConsent,
  saveConsent,
  type ConsentState,
} from "@/lib/consent/consent";

type Mode = "hidden" | "banner" | "preferences";

export function CookieConsent() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const current = getConsent();
    if (!current) {
      setMode("banner");
    } else {
      setAnalytics(current.analytics);
      setMarketing(current.marketing);
    }

    const openHandler = () => {
      const c = getConsent();
      if (c) {
        setAnalytics(c.analytics);
        setMarketing(c.marketing);
      }
      setMode("preferences");
    };
    window.addEventListener(CONSENT_OPEN_EVENT, openHandler);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, openHandler);
  }, []);

  const persist = useCallback((next: Pick<ConsentState, "analytics" | "marketing">) => {
    saveConsent(next);
    setMode("hidden");
  }, []);

  const acceptAll = useCallback(() => persist({ analytics: true, marketing: true }), [persist]);
  const rejectAll = useCallback(() => persist({ analytics: false, marketing: false }), [persist]);
  const saveSelection = useCallback(
    () => persist({ analytics, marketing }),
    [persist, analytics, marketing],
  );

  if (mode === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-9999 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="pointer-events-auto w-full max-w-3xl rounded-2xl border border-brand-100 bg-white p-5 shadow-xl sm:p-6">
        {mode === "banner" ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2
                id="cookie-consent-title"
                className="font-display text-lg text-brand-800"
              >
                Ciasteczka w Lumine Concept
              </h2>
              <p className="mt-1 text-sm leading-snug text-brand-600">
                Używamy plików cookie, żeby strona działała (koszyk, sesja), a za Twoją zgodą —
                także do analizy ruchu (PostHog) i reklam (Meta Pixel). Możesz zaakceptować
                wszystkie albo wybrać tylko te, których potrzebujesz.{" "}
                <Link
                  href="/polityka-prywatnosci"
                  className="underline underline-offset-2 hover:text-brand-800"
                >
                  Polityka prywatności
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:w-56 sm:shrink-0">
              <button
                type="button"
                onClick={acceptAll}
                className="inline-flex items-center justify-center rounded-md bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-900"
              >
                Akceptuję wszystkie
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className="inline-flex items-center justify-center rounded-md border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50"
              >
                Tylko niezbędne
              </button>
              <button
                type="button"
                onClick={() => setMode("preferences")}
                className="text-xs font-medium uppercase tracking-[0.15em] text-brand-500 underline-offset-2 hover:text-brand-800 hover:underline"
              >
                Ustawienia
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 id="cookie-consent-title" className="font-display text-lg text-brand-800">
              Ustawienia cookies
            </h2>
            <p className="mt-1 text-sm text-brand-600">
              Wybierz kategorie, na które wyrażasz zgodę.
            </p>

            <ul className="mt-4 divide-y divide-brand-100 rounded-lg border border-brand-100">
              <li className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-semibold text-brand-800">Niezbędne</p>
                  <p className="mt-0.5 text-xs text-brand-500">
                    Wymagane do działania koszyka, sesji i bezpieczeństwa. Nie można wyłączyć.
                  </p>
                </div>
                <span className="mt-1 text-xs font-medium uppercase tracking-wider text-brand-400">
                  zawsze aktywne
                </span>
              </li>

              <li className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-semibold text-brand-800">Analityka</p>
                  <p className="mt-0.5 text-xs text-brand-500">
                    PostHog — anonimowe statystyki użycia, nagrania sesji, heatmapy.
                  </p>
                </div>
                <ToggleSwitch
                  checked={analytics}
                  onChange={setAnalytics}
                  label="Zgoda na analitykę"
                />
              </li>

              <li className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-semibold text-brand-800">Marketing</p>
                  <p className="mt-0.5 text-xs text-brand-500">
                    Meta Pixel — personalizacja reklam Facebook / Instagram.
                  </p>
                </div>
                <ToggleSwitch
                  checked={marketing}
                  onChange={setMarketing}
                  label="Zgoda na marketing"
                />
              </li>
            </ul>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={rejectAll}
                className="inline-flex items-center justify-center rounded-md border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-800 hover:bg-brand-50"
              >
                Odrzuć wszystko
              </button>
              <button
                type="button"
                onClick={saveSelection}
                className="inline-flex items-center justify-center rounded-md border border-brand-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
              >
                Zapisz wybór
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="inline-flex items-center justify-center rounded-md bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-900"
              >
                Akceptuję wszystkie
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
        checked ? "bg-brand-800" : "bg-brand-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
