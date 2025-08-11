import validateBudgetBody from "./validateBudgetBody.middleware";
import { ValidationError } from "../types/error";
import { Request, Response } from "express";

describe("validateBudgetBody 미들웨어", () => {
  const mockRes = {} as Response;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockNext = jest.fn();
  });

  test("유효한 예산 정보가 들어오면 next()를 호출해야 한다", () => {
    const mockReq = {
      body: {
        currentMonthBudget: 10000,
        monthlyBudget: 50000,
      },
    } as Request;

    validateBudgetBody(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test("currentMonthBudget이나 monthlyBudget이 불린형이면 ValidationError를 던져야 한다", () => {
    const mockReq = {
      body: {
        currentMonthBudget: false,
        monthlyBudget: true,
      },
    } as unknown as Request;

    expect(() => validateBudgetBody(mockReq, mockRes, mockNext)).toThrow(ValidationError);
  });

  test("currentMonthBudget가 문자열이면 ValidationError를 던져야 한다", () => {
    const mockReq = {
      body: {
        currentMonthBudget: "10000",
        monthlyBudget: 50000,
      },
    } as unknown as Request;

    expect(() => validateBudgetBody(mockReq, mockRes, mockNext)).toThrow(ValidationError);
    expect(() => validateBudgetBody(mockReq, mockRes, mockNext)).toThrow(
      "이번 달 예산 또는 매달 예산에는 숫자만 입력해주세요.",
    );
  });

  test("monthlyBudget가 문자열이면 ValidationError를 던져야 한다", () => {
    const mockReq = {
      body: {
        currentMonthBudget: 10000,
        monthlyBudget: "50000",
      },
    } as unknown as Request;

    expect(() => validateBudgetBody(mockReq, mockRes, mockNext)).toThrow(ValidationError);
    expect(() => validateBudgetBody(mockReq, mockRes, mockNext)).toThrow(
      "이번 달 예산 또는 매달 예산에는 숫자만 입력해주세요.",
    );
  });

  test("currentMonthBudget가 음수이면 ValidationError를 던져야 한다", () => {
    const mockReq = {
      body: {
        currentMonthBudget: -1000,
        monthlyBudget: 50000,
      },
    } as Request;

    expect(() => validateBudgetBody(mockReq, mockRes, mockNext)).toThrow(ValidationError);
    expect(() => validateBudgetBody(mockReq, mockRes, mockNext)).toThrow("예산은 0원 이상으로 설정해주세요.");
  });

  test("monthlyBudget가 음수이면 ValidationError를 던져야 한다", () => {
    const mockReq = {
      body: {
        currentMonthBudget: 1000,
        monthlyBudget: -5000,
      },
    } as Request;

    expect(() => validateBudgetBody(mockReq, mockRes, mockNext)).toThrow(ValidationError);
    expect(() => validateBudgetBody(mockReq, mockRes, mockNext)).toThrow("예산은 0원 이상으로 설정해주세요.");
  });
});
