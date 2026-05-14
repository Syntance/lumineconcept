"use client";

/**
 * Notion "Analityka i konwersje → eventy formularza".
 *
 * Hook obsługuje:
 *  - `form_start` raz per sesja (po pierwszym focusie pola formularza),
 *  - `form_abandon` przy `beforeunload` (jeśli `start` był, a `submit` nie),
 *  - timeout inaktywności 60 s na formularzu = `form_abandon` (bez czekania na unload),
 *  - lekkie API do raportowania `form_error` (`reportError`).
 *
 * Konsumpcja w komponencie formularza (przykład dla `logo3d_wycena`):
 *
 *   const tracker = useFormTracking("logo3d_wycena");
 *   <input onFocus={tracker.handleFocus} onBlur={tracker.recordField("email")} />
 *   <button onClick={tracker.handleSubmitSuccess}>Wyślij</button>
 */
import { useCallback, useEffect, useRef } from "react";
import {
  trackFormAbandon,
  trackFormError,
  trackFormStart,
  type FormName,
} from "@/lib/analytics/events";

const INACTIVITY_TIMEOUT_MS = 60_000;

export interface FormTracker {
  /** Podpiąć pod `onFocus` formularza (każde pole). Idempotentne. */
  handleFocus: () => void;
  /** Wywołać po SUKCESIE submita — wyłącza monitoring porzucenia. */
  handleSubmitSuccess: () => void;
  /** Zaznacza pole które user właśnie tknął (do `lastField` w `form_abandon`). */
  recordField: (fieldName: string) => () => void;
  /** Zgłoszenie błędu walidacji / serwera. */
  reportError: (fieldName: string, errorType: "required" | "format" | "size" | "server") => void;
}

export function useFormTracking(formName: FormName): FormTracker {
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const lastFieldRef = useRef<string | undefined>(undefined);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushAbandon = useCallback(
    (lastField?: string) => {
      if (!startedRef.current || submittedRef.current) return;
      submittedRef.current = true; // raz per sesja
      trackFormAbandon({
        formName,
        lastField: lastField ?? lastFieldRef.current,
      });
    },
    [formName],
  );

  const armInactivity = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      flushAbandon();
    }, INACTIVITY_TIMEOUT_MS);
  }, [flushAbandon]);

  const handleFocus = useCallback(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      trackFormStart(formName);
    }
    armInactivity();
  }, [formName, armInactivity]);

  const recordField = useCallback(
    (fieldName: string) => () => {
      lastFieldRef.current = fieldName;
      armInactivity();
    },
    [armInactivity],
  );

  const handleSubmitSuccess = useCallback(() => {
    submittedRef.current = true;
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const reportError = useCallback(
    (fieldName: string, errorType: "required" | "format" | "size" | "server") => {
      trackFormError({ formName, fieldName, errorType });
    },
    [formName],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onUnload = () => flushAbandon();
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [flushAbandon]);

  return { handleFocus, handleSubmitSuccess, recordField, reportError };
}
