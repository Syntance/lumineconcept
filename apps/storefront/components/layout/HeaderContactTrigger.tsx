"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ContactCalloutPanel } from "./ContactCalloutPanel";
import { trackCtaClick } from "@/lib/analytics/events";

interface HeaderContactTriggerProps {
  /** Te same klasy co linki nawigacji (`NAV_LINK_CLASS`). */
  className: string;
}

export function HeaderContactTrigger({ className }: HeaderContactTriggerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative inline-flex items-center" ref={rootRef}>
      <button
        type="button"
        className={`${className} cursor-pointer appearance-none border-0 bg-transparent p-0`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((v) => {
            // Otwarcie calloutu = intencja kontaktu (Notion: Pixel `Contact`).
            if (!v) {
              trackCtaClick({
                ctaLabel: "kontakt_callout_open",
                position: "header",
                contactIntent: true,
              });
            }
            return !v;
          });
        }}
      >
        Kontakt
      </button>
      {open ? (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 w-[min(calc(100vw-2rem),18.5rem)] pt-2"
          role="dialog"
          aria-label="Dane kontaktowe"
        >
          <div className="rounded-lg border border-brand-100 bg-white p-5 shadow-lg">
            <ContactCalloutPanel onNavigate={close} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
