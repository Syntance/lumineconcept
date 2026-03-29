"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="pl">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
            gap: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#8B7D74",
            }}
          >
            Coś poszło nie tak
          </p>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 400,
              color: "#3D2E27",
              margin: 0,
            }}
          >
            Wystąpił błąd
          </h1>
          <p style={{ maxWidth: "24rem", fontSize: "0.875rem", color: "#6B5D55" }}>
            Przepraszamy za utrudnienia. Spróbuj odświeżyć stronę lub wróć do
            sklepu.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "0.625rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                border: "1px solid #3D2E27",
                borderRadius: "0.375rem",
                background: "transparent",
                color: "#3D2E27",
                cursor: "pointer",
              }}
            >
              Spróbuj ponownie
            </button>
            <a
              href="/"
              style={{
                padding: "0.625rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                border: "none",
                borderRadius: "0.375rem",
                background: "#B08D7D",
                color: "#fff",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Strona główna
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
