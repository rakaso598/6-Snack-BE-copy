import validateGetOrderQuery from "./validateGetOrderQuery.middleware";
import { BadRequestError } from "../types/error";
import { Request, Response } from "express";
import { TGetOrdersQueryDto } from "../dtos/order.dto";

describe("validateGetOrderQuery 미들웨어", () => {
  const mockRes = {} as Response;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockNext = jest.fn();
  });

  test("status가 'pending'일 경우 next()가 호출되어야 한다", () => {
    const mockReq = {
      query: {
        status: "pending",
      },
    } as unknown as Request<{}, {}, {}, TGetOrdersQueryDto>;

    validateGetOrderQuery(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test("status가 'approved'일 경우 next()가 호출되어야 한다", () => {
    const mockReq = {
      query: {
        status: "approved",
      },
    } as unknown as Request<{}, {}, {}, TGetOrdersQueryDto>;

    validateGetOrderQuery(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test("status가 없는 경우 BadRequestError가 발생해야 한다", () => {
    const mockReq = {
      query: {},
    } as unknown as Request<{}, {}, {}, TGetOrdersQueryDto>;

    expect(() => validateGetOrderQuery(mockReq, mockRes, mockNext)).toThrow(BadRequestError);
    expect(() => validateGetOrderQuery(mockReq, mockRes, mockNext)).toThrow("상태(pending, approved)를 입력해주세요.");
  });

  test("status가 잘못된 값일 경우 BadRequestError가 발생해야 한다", () => {
    const mockReq = {
      query: {
        status: "rejected",
      },
    } as unknown as Request<{}, {}, {}, TGetOrdersQueryDto>;

    expect(() => validateGetOrderQuery(mockReq, mockRes, mockNext)).toThrow(BadRequestError);
    expect(() => validateGetOrderQuery(mockReq, mockRes, mockNext)).toThrow("올바른 상태를 입력해주세요.");
  });
});
