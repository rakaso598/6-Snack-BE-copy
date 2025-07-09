import { RequestHandler } from "express";
import orderService from "../services/order.service";

// 승인된 전체 구매내역 조회
const getApprovedOrders: RequestHandler = async (req, res, next) => {
  const orderList = await orderService.getApprovedOrders();

  res.status(200).json(orderList);
};

// 승인된 구매내역 상세 조회
const getApprovedOrder: RequestHandler = async (req, res, next) => {
  const orderId = Number(req.params.orderId);

  const order = await orderService.getApprovedOrder(orderId);

  res.status(200).json(order);
};

export default {
  getApprovedOrders,
  getApprovedOrder,
};
