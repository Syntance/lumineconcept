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
  const [panelMode, setPanelMode] = useState<"info" | "form">("info");
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setPanelMode("info");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

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
            if (!v) {
              trackCtaClick({
                ctaLabel: "kontakt_callout_open",
                position: "header",
                contactIntent: true,
              });
            } else {
              setPanelMode("info");
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
          className={`absolute right-0 top-full z-50 pt-2 ${
            panelMode === "form"
              ? "w-[min(calc(100vw-2rem),22rem)]"
              : "w-[min(calc(100vw-2rem),18.5rem)]"
          }`}
          role="dialog"
          aria-label={panelMode === "form" ? "Formularz kontaktowy" : "Dane kontaktowe"}
        >
          <div className="rounded-lg border border-brand-100 bg-white p-5 shadow-lg">
            <ContactCalloutPanel
              mode={panelMode}
              onOpenForm={() => setPanelMode("form")}
              onBackToInfo={() => setPanelMode("info")}
              onNavigate={close}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
