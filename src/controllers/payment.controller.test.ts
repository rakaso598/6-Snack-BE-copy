import { Request, Response, NextFunction } from "express";
import paymentController from "./payment.controller";
import axios from "axios";
import prisma from "../config/prisma";
import paymentService from "../services/payment.service";
import orderService from "../services/order.service";
import orderRepository from "../repositories/order.repository";
import cartRepository from "../repositories/cart.repository";
import { AuthenticationError, NotFoundError } from "../types/error";
import { Role } from "@prisma/client";

jest.mock("../config/prisma", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
  },
}));
jest.mock("axios");
jest.mock("../services/payment.service");
jest.mock("../services/order.service");
jest.mock("../repositories/order.repository");
jest.mock("../repositories/cart.repository");

describe("paymentController.confirmPayment", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        paymentKey: "payKey",
        orderId: "orderId",
        amount: "10000",
      },
      user: {
        id: "userId",
        name: "홍길동",
        email: "hong@test.com", // 필수
        password: "hashedpassword", // 필수 (테스트용 더미값)
        companyId: 1,
        company: {
          id: 1,
          name: "회사명",
          bizNumber: "123-45-67890",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null, // 필수
        hashedRefreshToken: null, // 필수
        role: Role.USER,
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.spyOn(axios, "isAxiosError").mockImplementation((error) => {
      return error && error.isAxiosError === true;
    });

    // 기본 prisma $transaction 모킹 (콜백 함수 실행)
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
      return await cb({}); // mock 트랜잭션 객체 빈 객체 전달
    });

    // SECRET_KEY env 변수 세팅
    process.env.SECRET_KEY = "secretKey";
  });

  test("정상적으로 결제 승인 처리 후 200 응답을 반환한다", async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      status: 200,
      data: {
        orderName: "주문명",
        method: "카드",
        requestedAt: "2025-08-10T00:00:00Z",
        approvedAt: "2025-08-10T00:01:00Z",
        totalAmount: 10000,
        suppliedAmount: 9000,
        vat: 1000,
      },
    });

    (paymentService.createPayment as jest.Mock).mockResolvedValue(undefined);
    (orderService.updateOrder as jest.Mock).mockResolvedValue({ id: "orderId", status: "APPROVED" });

    await paymentController.confirmPayment(req as Request, res as Response, next);

    // axios.post 호출 검증
    expect(axios.post).toHaveBeenCalledWith(
      "https://api.tosspayments.com/v1/payments/confirm",
      { orderId: "orderId", amount: "10000", paymentKey: "payKey" },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("Basic "),
          "Content-Type": "application/json",
        }),
      }),
    );

    // paymentService.createPayment, orderService.updateOrder 호출 확인
    expect(paymentService.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "orderId",
        paymentKey: "payKey",
        orderName: "주문명",
        method: "카드",
      }),
      expect.any(Object), // 트랜잭션 객체
    );
    expect(orderService.updateOrder).toHaveBeenCalledWith("orderId", 1, {
      approver: "홍길동",
      adminMessage: "즉시 구매",
      status: "APPROVED",
    });

    // 응답 상태 및 데이터 검증
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ orderName: "주문명", method: "카드" }));
  });

  test("user 정보가 없으면 AuthenticationError 발생", async () => {
    req.user = undefined;

    await expect(paymentController.confirmPayment(req as Request, res as Response, next)).rejects.toThrow(
      AuthenticationError,
    );
  });

  test("axios 요청 실패 시 주문 복구 및 삭제 후 에러 응답 반환", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 400, data: { message: "잘못된 요청" } },
    };
    (axios.post as jest.Mock).mockRejectedValue(axiosError);

    (orderRepository.getOrderWithCartItemIdsById as jest.Mock).mockResolvedValue({
      receipts: [{ productId: 1 }, { productId: 2 }],
    });

    (cartRepository.revertCartItem as jest.Mock).mockResolvedValue(undefined);
    (orderRepository.deleteReceiptAndOrder as jest.Mock).mockResolvedValue(undefined);

    await paymentController.confirmPayment(req as Request, res as Response, next);

    expect(orderRepository.getOrderWithCartItemIdsById).toHaveBeenCalledWith("orderId");

    expect(cartRepository.revertCartItem).toHaveBeenCalledWith("userId", [1, 2], expect.any(Object));
    expect(orderRepository.deleteReceiptAndOrder).toHaveBeenCalledWith("orderId", expect.any(Object));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "잘못된 요청" });
  });

  test("axios 요청 실패 & 주문 정보 없으면 NotFoundError 발생", async () => {
    (axios.post as jest.Mock).mockRejectedValue(new Error("fail"));
    (orderRepository.getOrderWithCartItemIdsById as jest.Mock).mockResolvedValue(null);

    await expect(paymentController.confirmPayment(req as Request, res as Response, next)).rejects.toThrow(
      NotFoundError,
    );
  });

  test("axios 요청 실패 시 예외 발생하면 500 에러 응답 반환", async () => {
    (axios.post as jest.Mock).mockRejectedValue(new Error("some error"));

    (orderRepository.getOrderWithCartItemIdsById as jest.Mock).mockResolvedValue({
      receipts: [{ productId: 1 }],
    });

    (cartRepository.revertCartItem as jest.Mock).mockResolvedValue(undefined);
    (orderRepository.deleteReceiptAndOrder as jest.Mock).mockResolvedValue(undefined);

    await paymentController.confirmPayment(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "결제 실패" });
  });
});
