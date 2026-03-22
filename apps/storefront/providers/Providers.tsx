"use client";

import { Suspense, type ReactNode } from "react";
import { CartProvider } from "./CartProvider";
import { PostHogProvider } from "./PostHogProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <PostHogProvider>
        <CartProvider>{children}</CartProvider>
      </PostHogProvider>
    </Suspense>
  );
}
