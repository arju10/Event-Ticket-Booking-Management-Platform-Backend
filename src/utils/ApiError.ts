// A typed application error carrying an HTTP status, an error `code` (used
// in the standard error envelope), and optional field-level `errors`.
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly errors: Array<{ field: string; message: string }>;

  constructor(
    statusCode: number,
    message: string,
    code = "ERROR",
    errors: Array<{ field: string; message: string }> = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, errors: Array<{ field: string; message: string }> = []) {
    return new ApiError(400, message, "VALIDATION_ERROR", errors);
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(401, message, "UNAUTHORIZED");
  }
  static invalidToken(message = "Invalid or expired token") {
    return new ApiError(401, message, "INVALID_TOKEN");
  }
  static forbidden(message = "Insufficient permissions") {
    return new ApiError(403, message, "FORBIDDEN");
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, message, "NOT_FOUND");
  }
  static conflict(message: string, code = "CONFLICT") {
    return new ApiError(409, message, code);
  }
  static unprocessable(message: string, code = "UNPROCESSABLE") {
    return new ApiError(422, message, code);
  }
  static paymentFailed(message = "Payment processing failed") {
    return new ApiError(402, message, "PAYMENT_FAILED");
  }
  static internal(message = "Something went wrong") {
    return new ApiError(500, message, "INTERNAL_SERVER_ERROR");
  }
}
