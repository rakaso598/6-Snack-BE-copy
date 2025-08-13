import validateUpdateStatusOrderBody from "./validateUpdateStatusOrderBody.middleware";
import { ValidationError } from "../types/error";
import { Request, Response } from "express";

describe("validateUpdateStatusOrderBody 미들웨어", () => {
  const mockRes = {} as Response;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockNext = jest.fn();
  });

  test("status 값이 'APPROVED'일 경우 next()가 호출되어야 한다", () => {
    const mockReq = {
      body: {
        status: "APPROVED",
      },
    } as Request;

    validateUpdateStatusOrderBody(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test("status 값이 'REJECTED'일 경우 next()가 호출되어야 한다", () => {
    const mockReq = {
      body: {
        status: "REJECTED",
      },
    } as Request;

    validateUpdateStatusOrderBody(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test("status 값이 없는 경우 ValidationError가 발생해야 한다", () => {
    const mockReq = {
      body: {},
    } as Request;

    expect(() => validateUpdateStatusOrderBody(mockReq, mockRes, mockNext)).toThrow(ValidationError);
    expect(() => validateUpdateStatusOrderBody(mockReq, mockRes, mockNext)).toThrow("상태 값을 입력해주세요.");
  });

  test("status 값이 유효하지 않은 문자열인 경우 ValidationError가 발생해야 한다", () => {
    const mockReq = {
      body: {
        status: "PENDING",
      },
    } as Request;

    expect(() => validateUpdateStatusOrderBody(mockReq, mockRes, mockNext)).toThrow(ValidationError);
    expect(() => validateUpdateStatusOrderBody(mockReq, mockRes, mockNext)).toThrow("올바른 상태를 입력해주세요.");
  });
});
