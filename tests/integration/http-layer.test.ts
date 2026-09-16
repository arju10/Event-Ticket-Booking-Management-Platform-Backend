import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

// These tests exercise the real Express app (routing, middleware chain, Zod
// validation, error handling) end to end via supertest. They deliberately do
// NOT touch the database -- every request here either needs no DB access
// (health check, 404, pure validation failures caught before any Prisma
// call) or is expected to fail at the DB layer, which is fine since we're
// only asserting on the HTTP-layer behavior. Tests that need real data
// (successful register/login/booking flows) belong in a separate suite that
// requires a live DATABASE_URL -- see tests/integration/README.md.
let app: typeof import("../../src/app").default;

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET ??= "test_access_secret";
  process.env.JWT_REFRESH_SECRET ??= "test_refresh_secret";
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
  ({ default: app } = await import("../../src/app"));
});

describe("GET /health", () => {
  it("returns 200 with a success envelope and no auth required", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("timestamp");
  });
});

describe("unknown routes", () => {
  it("returns a 404 with the standard error envelope", async () => {
    const res = await request(app).get("/api/v1/this-route-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});

describe("POST /api/v1/auth/register validation", () => {
  it("rejects an invalid email with a 400 and field-level errors", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "not-an-email", password: "short", name: "" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toContain("body.email");
  });

  it("rejects a password missing the required complexity rules", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "valid@example.com",
        password: "alllowercase1",
        name: "Test User",
      });

    expect(res.status).toBe(400);
    const passwordError = res.body.errors.find(
      (e: { field: string }) => e.field === "body.password",
    );
    expect(passwordError).toBeDefined();
  });

  it("rejects an attempt to self-register as ADMIN", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "wannabe-admin@example.com",
        password: "ValidPass123!",
        name: "Test User",
        role: "ADMIN",
      });

    expect(res.status).toBe(400);
  });
});

describe("protected routes without a token", () => {
  it("GET /api/v1/users/me returns 401 with no Authorization header", async () => {
    const res = await request(app).get("/api/v1/users/me");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });

  it("POST /api/v1/events returns 401 with no Authorization header (before role check even runs)", async () => {
    const res = await request(app).post("/api/v1/events").send({ title: "x" });
    expect(res.status).toBe(401);
  });
});

describe("protected routes with a malformed token", () => {
  it("returns 401 INVALID_TOKEN for a garbage bearer token", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "Bearer not-a-real-jwt");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });
});
