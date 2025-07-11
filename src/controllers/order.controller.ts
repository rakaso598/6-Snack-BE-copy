import { RequestHandler } from "express";
import orderService from "../services/order.service";
import { TGetOrderParamsDto, TGetOrdersQueryDto, TUpdateStatusOrderBodyDto } from "../dtos/order.dto";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";

// 구매내역 조회(대기 or 승인)
const getOrders: RequestHandler<{}, {}, {}, TGetOrdersQueryDto> = async (req, res, next) => {
  const offset = parseNumberOrThrow(req.query.offset ?? "0", "offset");
  const limit = parseNumberOrThrow(req.query.limit ?? "4", "limit");
  const { orderBy, status } = req.query;

  const orderList = await orderService.getOrders({ offset, limit, orderBy, status });

  res.status(200).json(orderList);
};

// 구매내역 상세 조회(대기 or 승인)
const getOrder: RequestHandler<TGetOrderParamsDto, {}, {}, TGetOrdersQueryDto> = async (req, res, next) => {
  const orderId = parseNumberOrThrow(req.params.orderId, "orderId");
  const { status } = req.query;

  const order = await orderService.getOrder(orderId, status);

  res.status(200).json(order);
};

// 구매 승인 | 구매 반려
const updateOrder: RequestHandler<TGetOrderParamsDto, {}, TUpdateStatusOrderBodyDto> = async (req, res, next) => {
  const approver = req.user!.name;
  const orderId = parseNumberOrThrow(req.params.orderId, "orderId");
  const { adminMessage = "", status } = req.body;

  const updatedOrder = await orderService.updateOrder(orderId, { approver, adminMessage, status });

  res.status(200).json(updatedOrder);
};

export default {
  getOrders,
  getOrder,
  updateOrder,
};
