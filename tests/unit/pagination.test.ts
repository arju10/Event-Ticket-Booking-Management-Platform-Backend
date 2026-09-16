import { describe, it, expect } from "vitest";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../src/types/common.types";

describe("parsePagination", () => {
  it("defaults to page 1, limit 20 when nothing is provided", () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("computes skip correctly for a later page", () => {
    expect(parsePagination({ page: "3", limit: "10" })).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
    });
  });

  it("clamps page below 1 up to 1", () => {
    expect(parsePagination({ page: "0" }).page).toBe(1);
    expect(parsePagination({ page: "-5" }).page).toBe(1);
  });

  it("clamps limit above 100 down to 100", () => {
    expect(parsePagination({ limit: "9999" }).limit).toBe(100);
  });

  it("clamps limit below 1 up to 1", () => {
    expect(parsePagination({ limit: "0" }).limit).toBe(1);
  });

  it("falls back to defaults for garbage input instead of NaN", () => {
    const result = parsePagination({ page: "not-a-number", limit: "also-bad" });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

describe("buildPaginationMeta", () => {
  it("computes totalPages correctly, rounding up", () => {
    expect(buildPaginationMeta(45, 1, 20).totalPages).toBe(3);
  });

  it("reports hasNext/hasPrev correctly on the first page", () => {
    const meta = buildPaginationMeta(45, 1, 20);
    expect(meta.hasPrev).toBe(false);
    expect(meta.hasNext).toBe(true);
  });

  it("reports hasNext/hasPrev correctly on the last page", () => {
    const meta = buildPaginationMeta(45, 3, 20);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(true);
  });

  it("never reports fewer than 1 total page, even for zero results", () => {
    expect(buildPaginationMeta(0, 1, 20).totalPages).toBe(1);
    expect(buildPaginationMeta(0, 1, 20).hasNext).toBe(false);
  });
});
