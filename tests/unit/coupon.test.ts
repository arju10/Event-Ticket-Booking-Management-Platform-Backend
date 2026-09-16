import { describe, it, expect } from "vitest";
import { calculateDiscount } from "../../src/modules/coupon/coupon.pricing";

describe("calculateDiscount", () => {
  it("computes a percentage discount correctly", () => {
    expect(calculateDiscount("PERCENTAGE", 50, null, 1000)).toBe(500);
  });

  it("computes a fixed discount correctly", () => {
    expect(calculateDiscount("FIXED", 150, null, 1000)).toBe(150);
  });

  it("caps a percentage discount at maxDiscount", () => {
    // 50% of 1000 = 500, but capped at 100
    expect(calculateDiscount("PERCENTAGE", 50, 100, 1000)).toBe(100);
  });

  it("does not cap when the discount is already below maxDiscount", () => {
    expect(calculateDiscount("PERCENTAGE", 10, 1000, 1000)).toBe(100);
  });

  it("never lets the discount exceed the total price, even with no cap set", () => {
    // a fixed discount larger than the order itself should clamp to the order total
    expect(calculateDiscount("FIXED", 5000, null, 1000)).toBe(1000);
  });

  it("respects an explicit maxDiscount of 0 (regression: must not be treated as falsy/no-cap)", () => {
    expect(calculateDiscount("PERCENTAGE", 50, 0, 1000)).toBe(0);
  });

  it("handles a 100% percentage discount", () => {
    expect(calculateDiscount("PERCENTAGE", 100, null, 750)).toBe(750);
  });
});
