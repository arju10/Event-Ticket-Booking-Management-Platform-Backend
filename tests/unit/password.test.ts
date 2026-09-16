import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "../../src/utils/password";

describe("password hashing", () => {
  it("hashes a password to something other than the plaintext", async () => {
    const hashed = await hashPassword("MySecurePass123!");
    expect(hashed).not.toBe("MySecurePass123!");
    expect(hashed.length).toBeGreaterThan(20);
  });

  it("verifies the correct password against its own hash", async () => {
    const hashed = await hashPassword("MySecurePass123!");
    expect(await comparePassword("MySecurePass123!", hashed)).toBe(true);
  });

  it("rejects an incorrect password against the hash", async () => {
    const hashed = await hashPassword("MySecurePass123!");
    expect(await comparePassword("WrongPassword!", hashed)).toBe(false);
  });

  it("produces a different hash for the same password on repeated calls (salted)", async () => {
    const a = await hashPassword("SamePassword1!");
    const b = await hashPassword("SamePassword1!");
    expect(a).not.toBe(b);
  });
});
