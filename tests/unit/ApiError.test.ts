import { describe, it, expect } from "vitest";
import { ApiError } from "../../src/utils/ApiError";

describe("ApiError factory methods", () => {
  it("badRequest produces a 400 with VALIDATION_ERROR and passes through field errors", () => {
    const err = ApiError.badRequest("Validation failed", [
      { field: "email", message: "Invalid" },
    ]);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.errors).toEqual([{ field: "email", message: "Invalid" }]);
    expect(err.message).toBe("Validation failed");
  });

  it("unauthorized defaults to a standard message and 401/UNAUTHORIZED", () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Authentication required");
  });

  it("invalidToken uses 401/INVALID_TOKEN, distinct from unauthorized", () => {
    const err = ApiError.invalidToken();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("INVALID_TOKEN");
  });

  it("forbidden defaults to 403/FORBIDDEN", () => {
    expect(ApiError.forbidden().statusCode).toBe(403);
    expect(ApiError.forbidden().code).toBe("FORBIDDEN");
  });

  it("notFound defaults to 404/NOT_FOUND", () => {
    expect(ApiError.notFound().statusCode).toBe(404);
    expect(ApiError.notFound().code).toBe("NOT_FOUND");
  });

  it("conflict defaults to CONFLICT but allows a custom code (e.g. INSUFFICIENT_TICKETS)", () => {
    const err = ApiError.conflict(
      "Not enough tickets available",
      "INSUFFICIENT_TICKETS",
    );
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("INSUFFICIENT_TICKETS");
  });

  it("unprocessable defaults to 422/UNPROCESSABLE but allows a custom code", () => {
    const err = ApiError.unprocessable(
      "Cancellation not allowed",
      "CANCELLATION_NOT_ALLOWED",
    );
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe("CANCELLATION_NOT_ALLOWED");
  });

  it("paymentFailed defaults to 402/PAYMENT_FAILED", () => {
    expect(ApiError.paymentFailed().statusCode).toBe(402);
    expect(ApiError.paymentFailed().code).toBe("PAYMENT_FAILED");
  });

  it("internal defaults to 500/INTERNAL_SERVER_ERROR", () => {
    expect(ApiError.internal().statusCode).toBe(500);
    expect(ApiError.internal().code).toBe("INTERNAL_SERVER_ERROR");
  });

  it("is a real instanceof Error and instanceof ApiError (prototype chain intact)", () => {
    const err = ApiError.notFound();
    expect(err instanceof Error).toBe(true);
    expect(err instanceof ApiError).toBe(true);
  });
});
