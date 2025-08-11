import orderService from "./order.service";
import orderRepository from "../repositories/order.repository";
import budgetRepository from "../repositories/budget.repository";
import productRepository from "../repositories/product.repository";
import prisma from "../config/prisma";
import getDateForBudget from "../utils/getDateForBudget";
import { NotFoundError, BadRequestError } from "../types/error";

jest.mock("../repositories/order.repository");
jest.mock("../repositories/budget.repository");
jest.mock("../repositories/product.repository");
jest.mock("../config/prisma");
jest.mock("../utils/getDateForBudget");

describe("orderService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getOrders", () => {
    test("정상적으로 주문 목록을 조회한다", async () => {
      (orderRepository.getOrders as jest.Mock).mockResolvedValue([
        {
          id: 1,
          user: { name: "홍길동" },
          receipts: [{ productName: "상품1" }, { productName: "상품2" }],
          totalPrice: 10000,
          status: "pending",
        },
      ]);
      (orderRepository.getOrdersTotalCount as jest.Mock).mockResolvedValue(1);

      const result = await orderService.getOrders({ page: 1, limit: 10, orderBy: "latest", status: "pending" }, 1);

      expect(orderRepository.getOrders).toHaveBeenCalledWith(
        { offset: 0, limit: 10, orderBy: "createdAt", status: "pending" },
        1,
      );
      expect(orderRepository.getOrdersTotalCount).toHaveBeenCalledWith({ status: "pending" }, 1);

      expect(result.orders[0]).toHaveProperty("requester", "홍길동");
      expect(result.orders[0]).toHaveProperty("productName", "상품1 외 1건");
      expect(result.meta.totalCount).toBe(1);
      expect(result.meta.currentPage).toBe(1);
    });

    test("주문 목록이 없으면 NotFoundError를 던진다", async () => {
      (orderRepository.getOrders as jest.Mock).mockResolvedValue(null);

      await expect(
        orderService.getOrders({ page: 1, limit: 10, orderBy: "latest", status: "pending" }, 1),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getOrder", () => {
    test("정상적으로 주문 상세를 조회한다 (pending 상태)", async () => {
      (orderRepository.getOrderByIdAndStatus as jest.Mock).mockResolvedValue({
        id: "order-1",
        user: { name: "홍길동" },
        receipts: [{ productId: 1, productName: "상품1" }],
        totalPrice: 10000,
        status: "pending",
      });
      (getDateForBudget as jest.Mock).mockReturnValue({ year: "2025", month: "08" });
      (budgetRepository.getMonthlyBudget as jest.Mock).mockResolvedValue({
        currentMonthBudget: 100000,
        currentMonthExpense: 50000,
      });

      const result = await orderService.getOrder("order-1", "pending", 1);

      expect(orderRepository.getOrderByIdAndStatus).toHaveBeenCalledWith("order-1", "pending", 1);
      expect(budgetRepository.getMonthlyBudget).toHaveBeenCalledWith({ companyId: 1, year: "2025", month: "08" });

      expect(result.budget.currentMonthBudget).toBe(100000);
      expect(result.budget.currentMonthExpense).toBe(50000);
      expect(result.requester).toBe("홍길동");
    });

    test("예산이 없으면 NotFoundError를 던진다", async () => {
      (orderRepository.getOrderByIdAndStatus as jest.Mock).mockResolvedValue({
        id: "order-1",
        user: { name: "홍길동" },
        receipts: [{ productId: 1, productName: "상품1" }],
        totalPrice: 10000,
        status: "pending",
      });
      (getDateForBudget as jest.Mock).mockReturnValue({ year: "2025", month: "08" });
      (budgetRepository.getMonthlyBudget as jest.Mock).mockResolvedValue(null);

      await expect(orderService.getOrder("order-1", "pending", 1)).rejects.toThrow(NotFoundError);
    });

    test("정상적으로 주문 상세를 조회한다 (approved 상태)", async () => {
      (orderRepository.getOrderByIdAndStatus as jest.Mock).mockResolvedValue({
        id: "order-2",
        user: { name: "홍길동" },
        receipts: [{ productId: 2, productName: "상품2" }],
        totalPrice: 20000,
        status: "approved",
      });

      const result = await orderService.getOrder("order-2", "approved", 1);

      expect(orderRepository.getOrderByIdAndStatus).toHaveBeenCalledWith("order-2", "approved", 1);
      expect(result.budget.currentMonthBudget).toBeNull();
      expect(result.budget.currentMonthExpense).toBeNull();
    });

    test("주문 내역이 없으면 NotFoundError를 던진다", async () => {
      (orderRepository.getOrderByIdAndStatus as jest.Mock).mockResolvedValue(null);

      await expect(orderService.getOrder("order-1", "pending", 1)).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateOrder", () => {
    const mockTx = { commit: jest.fn(), rollback: jest.fn() };

    beforeEach(() => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));
    });

    test("정상적으로 주문 상태를 승인 처리한다", async () => {
      (orderRepository.getOrderById as jest.Mock).mockResolvedValue({
        id: "order-1",
        receipts: [{ productId: 1 }],
        totalPrice: 10000,
      });
      (orderRepository.updateOrder as jest.Mock).mockResolvedValue({
        id: "order-1",
        status: "APPROVED",
        totalPrice: 10000,
      });
      (getDateForBudget as jest.Mock).mockReturnValue({ year: "2025", month: "08" });
      (budgetRepository.getMonthlyBudget as jest.Mock).mockResolvedValue({
        currentMonthBudget: 100000,
        currentMonthExpense: 80000,
      });
      (budgetRepository.updateCurrentMonthExpense as jest.Mock).mockResolvedValue(undefined);
      (productRepository.updateCumulativeSales as jest.Mock).mockResolvedValue(undefined);

      const result = await orderService.updateOrder("order-1", 1, {
        approver: "관리자",
        adminMessage: "승인합니다",
        status: "APPROVED",
      });

      expect(orderRepository.getOrderById).toHaveBeenCalledWith("order-1");
      expect(orderRepository.updateOrder).toHaveBeenCalledWith(
        "order-1",
        { approver: "관리자", adminMessage: "승인합니다", status: "APPROVED" },
        mockTx,
      );
      expect(budgetRepository.getMonthlyBudget).toHaveBeenCalledWith({ companyId: 1, year: "2025", month: "08" });
      expect(budgetRepository.updateCurrentMonthExpense).toHaveBeenCalledWith(
        { companyId: 1, year: "2025", month: "08" },
        93000,
        mockTx,
      );
      expect(productRepository.updateCumulativeSales).toHaveBeenCalledWith([1], mockTx);
      expect(result.status).toBe("APPROVED");
    });

    test("주문이 없으면 NotFoundError를 던진다", async () => {
      (orderRepository.getOrderById as jest.Mock).mockResolvedValue(null);

      await expect(
        orderService.updateOrder("order-1", 1, { approver: "관리자", adminMessage: "승인", status: "APPROVED" }),
      ).rejects.toThrow(NotFoundError);
    });

    test("예산이 부족하면 BadRequestError를 던진다", async () => {
      (orderRepository.getOrderById as jest.Mock).mockResolvedValue({
        id: "order-1",
        receipts: [{ productId: 1 }],
        totalPrice: 10000,
      });
      (orderRepository.updateOrder as jest.Mock).mockResolvedValue({
        id: "order-1",
        status: "APPROVED",
        totalPrice: 10000,
      });
      (getDateForBudget as jest.Mock).mockReturnValue({ year: "2025", month: "08" });
      (budgetRepository.getMonthlyBudget as jest.Mock).mockResolvedValue({
        currentMonthBudget: 100000,
        currentMonthExpense: 90000,
      });

      await expect(
        orderService.updateOrder("order-1", 1, { approver: "관리자", adminMessage: "승인", status: "APPROVED" }),
      ).rejects.toThrow(BadRequestError);
    });

    test("반려(REJECTED) 상태일 때 예산 업데이트와 판매 횟수 증가를 하지 않는다", async () => {
      (orderRepository.getOrderById as jest.Mock).mockResolvedValue({
        id: "order-1",
        receipts: [{ productId: 1 }],
        totalPrice: 10000,
      });
      (orderRepository.updateOrder as jest.Mock).mockResolvedValue({
        id: "order-1",
        status: "REJECTED",
        totalPrice: 10000,
      });
      (getDateForBudget as jest.Mock).mockReturnValue({ year: "2025", month: "08" });

      const result = await orderService.updateOrder("order-1", 1, {
        approver: "관리자",
        adminMessage: "반려합니다",
        status: "REJECTED",
      });

      expect(orderRepository.updateOrder).toHaveBeenCalled();
      expect(budgetRepository.getMonthlyBudget).not.toHaveBeenCalled();
      expect(budgetRepository.updateCurrentMonthExpense).not.toHaveBeenCalled();
      expect(productRepository.updateCumulativeSales).not.toHaveBeenCalled();
      expect(result.status).toBe("REJECTED");
    });
  });
});
