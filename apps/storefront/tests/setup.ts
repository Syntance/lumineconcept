import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Każdy test dostaje czysty DOM i czyste localStorage — unikamy wycieków stanu
// między testami `CartProvider`, który zapisuje `express_delivery`.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

beforeEach(() => {
  // Ucisz console.warn/error w testach, jeśli chcemy je asercjować ręcznie.
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
