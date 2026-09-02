export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public errors?: any[];

  constructor(statusCode: number, message: string, code?: string, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
