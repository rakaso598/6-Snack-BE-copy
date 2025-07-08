export class AppError extends Error {
  code?: number; // 선택적 속성으로 변경
  data?: any; // 에러핸들러에서 사용하는 data 속성도 추가

  constructor(message: string, code?: number, data?: any) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = "AppError";
  }
}

// 자주 사용하는 에러들을 위한 편의 클래스들
export class BadRequestError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 400, data); // 400은 기본값
    this.name = "BadRequestError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 401, data); // 401은 기본값
    this.name = "AuthenticationError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 403, data); // 403은 기본값
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 404, data); // 404은 기본값
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 422, data); // 422는 기본값
    this.name = "ValidationError";
  }
}

export class ServerError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 500, data); // 500은 기본값
    this.name = "ServerError";
  }
}
