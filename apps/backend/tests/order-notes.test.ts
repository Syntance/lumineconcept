import { describe, expect, it } from "vitest";
import { sanitizeOrderNotes, ORDER_NOTES_MAX_LENGTH } from "../src/lib/order-notes";

describe("sanitizeOrderNotes", () => {
  it("usuwa tagi HTML i normalizuje białe znaki", () => {
    expect(sanitizeOrderNotes("  Proszę   zostawić   u   sąsiada  ")).toBe(
      "Proszę zostawić u sąsiada",
    );
    expect(sanitizeOrderNotes("<b>test</b>")).toBe("test");
  });

  it("obcina do maksymalnej długości", () => {
    const long = "a".repeat(ORDER_NOTES_MAX_LENGTH + 10);
    expect(sanitizeOrderNotes(long)).toHaveLength(ORDER_NOTES_MAX_LENGTH);
  });

  it("zwraca pusty string dla pustego inputu", () => {
    expect(sanitizeOrderNotes("   ")).toBe("");
    expect(sanitizeOrderNotes(undefined)).toBe("");
  });
});
