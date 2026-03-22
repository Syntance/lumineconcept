import type { Metadata } from "next";
import { KoszykClient } from "./client";

export const metadata: Metadata = {
  title: "Koszyk",
  robots: { index: false },
};

export default function KoszykPage() {
  return <KoszykClient />;
}
