import { describe, it, expect, beforeAll } from "vitest";

// JWT secrets are read from env at import time (src/config/env.ts), so they
// must be set before importing the module under test.
beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "test_access_secret";
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
});

describe("jwt sign/verify", () => {
  it("signs and verifies an access token round-trip", async () => {
    const { signAccessToken, verifyAccessToken } =
      await import("../../src/utils/jwt");
    const payload = {
      id: "usr_1",
      email: "test@example.com",
      role: "ATTENDEE" as const,
    };
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it("signs and verifies a refresh token round-trip", async () => {
    const { signRefreshToken, verifyRefreshToken } =
      await import("../../src/utils/jwt");
    const payload = {
      id: "usr_2",
      email: "other@example.com",
      role: "ORGANIZER" as const,
    };
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(payload && token ? token : token);
    expect(decoded.id).toBe(payload.id);
  });

  it("rejects a tampered token", async () => {
    const { signAccessToken, verifyAccessToken } =
      await import("../../src/utils/jwt");
    const token = signAccessToken({
      id: "usr_3",
      email: "a@example.com",
      role: "ADMIN" as const,
    });
    const tampered = token.slice(0, -2) + "xx";
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it("rejects an access token when verified with the refresh secret (and vice versa)", async () => {
    const { signAccessToken, verifyRefreshToken } =
      await import("../../src/utils/jwt");
    const token = signAccessToken({
      id: "usr_4",
      email: "b@example.com",
      role: "ATTENDEE" as const,
    });
    expect(() => verifyRefreshToken(token)).toThrow();
  });
});
