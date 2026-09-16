import { describe, it, expect } from "vitest";
import {
  generateBookingNumber,
  generateSlug,
} from "../../src/utils/generateCodes";

describe("generateBookingNumber", () => {
  it("matches the BK-YYYYMMDD-XXXXXX format", () => {
    const number = generateBookingNumber();
    expect(number).toMatch(/^BK-\d{8}-[A-Z0-9]{6}$/);
  });

  it("produces a different code on every call (no collisions across a batch)", () => {
    const codes = new Set(
      Array.from({ length: 200 }, () => generateBookingNumber()),
    );
    expect(codes.size).toBe(200);
  });
});

describe("generateSlug", () => {
  it("lowercases and hyphenates the title", () => {
    const slug = generateSlug("Tech Conference 2026");
    expect(slug.startsWith("tech-conference-2026-")).toBe(true);
  });

  it("strips characters that are not alphanumeric before hyphenating", () => {
    const slug = generateSlug("Rock & Roll: Live!!");
    expect(slug).toMatch(/^rock-roll-live-[a-z0-9]+$/);
  });

  it("never leaves a leading or trailing hyphen before the random suffix", () => {
    const slug = generateSlug("  Spaced Out Title  ");
    expect(slug.startsWith("-")).toBe(false);
    // the random suffix is appended after a single hyphen, so no double-hyphen either
    expect(slug).not.toMatch(/--/);
  });

  it("produces a different slug for the same title on repeated calls", () => {
    const a = generateSlug("Same Title");
    const b = generateSlug("Same Title");
    expect(a).not.toBe(b);
  });
});
