import orderController from "./order.controller";
import orderService from "../services/order.service";
import { AuthenticationError } from "../types/error";
import { TUpdateStatusOrderBodyDto } from "../dtos/order.dto";

jest.mock("../services/order.service");

describe("orderController", () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      user: { companyId: 1, name: "관리자" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("getOrders", () => {
    test("정상적으로 주문 목록을 조회한다", async () => {
      req.query = { page: "1", limit: "5", orderBy: "createdAt", status: "WAITING" };
      const mockOrders = { items: [], total: 0 };

      (orderService.getOrders as jest.Mock).mockResolvedValue(mockOrders);

      await orderController.getOrders(req, res, next);

      expect(orderService.getOrders).toHaveBeenCalledWith(
        { page: 1, limit: 5, orderBy: "createdAt", status: "WAITING" },
        1,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    test("user가 없으면 AuthenticationError를 던진다", async () => {
      req.user = undefined;

      await expect(orderController.getOrders(req, res, next)).rejects.toThrow(AuthenticationError);
    });
  });

  describe("getOrder", () => {
    test("정상적으로 주문 상세를 조회한다", async () => {
      req.params.orderId = "order-1";
      req.query.status = "APPROVED";
      const mockOrder = { id: "order-1", status: "APPROVED" };

      (orderService.getOrder as jest.Mock).mockResolvedValue(mockOrder);

      await orderController.getOrder(req, res, next);

      expect(orderService.getOrder).toHaveBeenCalledWith("order-1", "APPROVED", 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockOrder);
    });

    test("user가 없으면 AuthenticationError를 던진다", async () => {
      req.user = undefined;

      await expect(orderController.getOrder(req, res, next)).rejects.toThrow(AuthenticationError);
    });
  });

  describe("updateOrder", () => {
    test("정상적으로 주문 상태를 업데이트한다", async () => {
      req.params.orderId = "order-1";
      req.body = {
        status: "APPROVED",
        adminMessage: "승인합니다.",
      } satisfies TUpdateStatusOrderBodyDto;

      const mockUpdatedOrder = { id: "order-1", status: "APPROVED" };
      (orderService.updateOrder as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      await orderController.updateOrder(req, res, next);

      expect(orderService.updateOrder).toHaveBeenCalledWith("order-1", 1, {
        approver: "관리자",
        adminMessage: "승인합니다.",
        status: "APPROVED",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedOrder);
    });

    test("user가 없으면 AuthenticationError를 던진다", async () => {
      req.user = undefined;

      await expect(orderController.updateOrder(req, res, next)).rejects.toThrow(AuthenticationError);
    });
  });
});
