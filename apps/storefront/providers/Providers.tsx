"use client";

import { Suspense, type ReactNode } from "react";
import { CartProvider } from "./CartProvider";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AnalyticsProvider>
        <CartProvider>{children}</CartProvider>
      </AnalyticsProvider>
    </Suspense>
  );
}
