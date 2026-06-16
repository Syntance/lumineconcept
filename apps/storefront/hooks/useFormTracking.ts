"use client";

import { useCallback, useEffect, useRef } from "react";
import { track } from "@/lib/analytics/track";
import type { FormName } from "@/lib/analytics/events/registry";

const INACTIVITY_TIMEOUT_MS = 60_000;

export interface FormTracker {
  handleFocus: () => void;
  handleSubmitSuccess: () => void;
  recordField: (fieldName: string) => () => void;
  reportError: (
    fieldName: string,
    errorType: "required" | "format" | "size" | "server",
  ) => void;
}

export function useFormTracking(formName: FormName): FormTracker {
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const lastFieldRef = useRef<string | undefined>(undefined);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushAbandon = useCallback(
    (lastField?: string) => {
      if (!startedRef.current || submittedRef.current) return;
      submittedRef.current = true;
      track("form_abandon", {
        form_name: formName,
        last_field: lastField ?? lastFieldRef.current,
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
      track("form_start", { form_name: formName });
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
    (
      fieldName: string,
      errorType: "required" | "format" | "size" | "server",
    ) => {
      track("form_error", {
        form_name: formName,
        field_name: fieldName,
        error_type: errorType,
      });
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
