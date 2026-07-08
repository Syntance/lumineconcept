"use client";

import { useEffect, useRef, useState } from "react";
import {
  CMS_PREVIEW_RELOAD,
  CMS_PREVIEW_SELECT,
  cmsFieldLabel,
} from "@/lib/cms-preview/messages";

/**
 * Nakładka trybu „edycji na żywo" — montowana WYŁĄCZNIE gdy draftMode
 * włączony (patrz PreviewOverlayGate). Podświetla elementy z `data-cms`,
 * klik wysyła postMessage do panelu magazynu (strona działa w iframie),
 * a `lumine-cms:reload` z panelu odświeża podgląd po zapisie.
 */
export function PreviewOverlay() {
  const [ready, setReady] = useState(false);
  const [inIframe, setInIframe] = useState(false);
  const [highlight, setHighlight] = useState<{
    rect: DOMRect;
    field: string;
  } | null>(null);
  const highlightedEl = useRef<Element | null>(null);

  // Nakładka edytora renderuje się WYŁĄCZNIE w iframie panelu CMS. Strona panelu
  // (top-level) i bezpośrednie wejście na stronę z aktywnym draftem dostają
  // `null` — edytor pojawia się tylko osadzony w podglądzie panelu.
  useEffect(() => {
    setInIframe(window.parent !== window);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!inIframe) return;
    function findTarget(target: EventTarget | null): HTMLElement | null {
      if (!(target instanceof Element)) return null;
      return target.closest<HTMLElement>("[data-cms]");
    }

    function onMouseMove(e: MouseEvent) {
      const el = findTarget(e.target);
      if (!el) {
        if (highlightedEl.current) {
          highlightedEl.current = null;
          setHighlight(null);
        }
        return;
      }
      if (el === highlightedEl.current) return;
      highlightedEl.current = el;
      setHighlight({
        rect: el.getBoundingClientRect(),
        field: el.dataset.cms ?? "",
      });
    }

    function onClick(e: MouseEvent) {
      const el = findTarget(e.target);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      const field = el.dataset.cms ?? "";
      if (window.parent !== window) {
        window.parent.postMessage(
          { type: CMS_PREVIEW_SELECT, field },
          window.location.origin,
        );
      }
    }

    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string } | null;
      if (data?.type === CMS_PREVIEW_RELOAD) {
        window.location.reload();
      }
    }

    // Scroll/resize unieważniają rect — chowamy podświetlenie do następnego ruchu.
    function onViewportChange() {
      highlightedEl.current = null;
      setHighlight(null);
    }

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("message", onMessage);
    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("resize", onViewportChange);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("message", onMessage);
      window.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [inIframe]);

  // Poza iframem panelu nie renderujemy nakładki edytora.
  if (!ready || !inIframe) return null;

  return (
    <>
      {/* Pasek statusu podglądu — widoczny tylko w iframie panelu CMS. */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2147483646,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "4px 12px",
          background: "#1c1917",
          color: "#fafaf9",
          fontSize: 12,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span>Tryb edycji na żywo — kliknij element, aby edytować</span>
        <a
          href={`/api/cms-preview/disable?path=${encodeURIComponent(
            window.location.pathname,
          )}`}
          style={{ color: "#fbbf24", textDecoration: "underline" }}
        >
          Zakończ
        </a>
      </div>

      {highlight ? (
        <div
          aria-hidden
          style={{
            position: "fixed",
            top: highlight.rect.top,
            left: highlight.rect.left,
            width: highlight.rect.width,
            height: highlight.rect.height,
            zIndex: 2147483645,
            pointerEvents: "none",
            outline: "2px solid #f59e0b",
            outlineOffset: 2,
            borderRadius: 4,
            background: "rgba(245, 158, 11, 0.08)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -24,
              left: 0,
              padding: "2px 8px",
              background: "#f59e0b",
              color: "#1c1917",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "system-ui, sans-serif",
              borderRadius: 4,
              whiteSpace: "nowrap",
            }}
          >
            {cmsFieldLabel(highlight.field)}
          </span>
        </div>
      ) : null}
    </>
  );
}
