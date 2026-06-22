"use client";

import { Suspense, type ReactNode } from "react";
import { CartProvider } from "./CartProvider";
import { AnalyticsEffects } from "@/components/analytics/AnalyticsEffects";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      {/*
       * Analytics poza drzewem strony — `useSearchParams()` w rodzicu wymuszało
       * BAILOUT_TO_CLIENT_SIDE_RENDERING całej aplikacji (brak hero w HTML → LCP ~10 s).
       */}
      <Suspense fallback={null}>
        <AnalyticsEffects />
      </Suspense>
    </CartProvider>
  );
}
