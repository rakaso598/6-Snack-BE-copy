export class AppError extends Error {
  code?: number;
  data?: any;

  constructor(message: string, code?: number, data?: any) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = "AppError";
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 400, data);
    this.name = "BadRequestError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 401, data);
    this.name = "AuthenticationError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 403, data);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 404, data);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 422, data);
    this.name = "ValidationError";
  }
}

export class ServerError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 500, data);
    this.name = "ServerError";
  }
} 