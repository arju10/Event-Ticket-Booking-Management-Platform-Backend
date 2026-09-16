import { describe, it, expect } from "vitest";
import { getRefundPercent } from "../../src/modules/booking/booking.constant";

describe("getRefundPercent (spec 8.3 refund policy)", () => {
  it("returns 100% at exactly 7 days (168 hours) before start", () => {
    expect(getRefundPercent(168)).toBe(100);
  });

  it("returns 100% for anything more than 7 days out", () => {
    expect(getRefundPercent(200)).toBe(100);
    expect(getRefundPercent(24 * 30)).toBe(100);
  });

  it("returns 50% at exactly 24 hours before start", () => {
    expect(getRefundPercent(24)).toBe(50);
  });

  it("returns 50% for the window between 24 hours and 7 days", () => {
    expect(getRefundPercent(72)).toBe(50);
    expect(getRefundPercent(167.99)).toBe(50);
  });

  it("returns 0% for less than 24 hours before start", () => {
    expect(getRefundPercent(23.99)).toBe(0);
    expect(getRefundPercent(1)).toBe(0);
  });

  it("returns 0% at or after the event start (zero or negative hours)", () => {
    expect(getRefundPercent(0)).toBe(0);
    expect(getRefundPercent(-5)).toBe(0);
  });
});
