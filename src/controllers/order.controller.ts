import { RequestHandler } from "express";
import orderService from "../services/order.service";
import { TApprovedOrderQueryDto, TOrderParamsDto, TUpdateStatusOrderBodyDto } from "../dtos/order.dto";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";

// 승인된 전체 구매내역 조회
const getApprovedOrders: RequestHandler<{}, {}, {}, TApprovedOrderQueryDto> = async (req, res, next) => {
  const offset = parseNumberOrThrow(req.query.offset ?? "0", "offset");
  const limit = parseNumberOrThrow(req.query.limit ?? "4", "limit");
  const { orderBy } = req.query;

  const orderList = await orderService.getApprovedOrders({ offset, limit, orderBy });

  res.status(200).json(orderList);
};

// 승인된 구매내역 상세 조회
const getApprovedOrder: RequestHandler<TOrderParamsDto> = async (req, res, next) => {
  const orderId = parseNumberOrThrow(req.params.orderId, "orderId");

  const order = await orderService.getApprovedOrder(orderId);

  res.status(200).json(order);
};

// 구매 승인 | 구매 반려
const updateOrder: RequestHandler<TOrderParamsDto, {}, TUpdateStatusOrderBodyDto> = async (req, res, next) => {
  const orderId = parseNumberOrThrow(req.params.orderId, "orderId");
  const body = req.body;

  const updatedOrder = await orderService.updateOrder(orderId, body);

  res.status(200).json(updatedOrder);
};

export default {
  getApprovedOrders,
  getApprovedOrder,
  updateOrder,
};
