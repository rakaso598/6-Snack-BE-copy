import orderRepository from "../repositories/order.repository";
import { NotFoundError } from "../types/error";

// 승인된 전체 구매내역 조회
const getApprovedOrders = async () => {
  return await orderRepository.getApprovedOrders();
};

// 승인된 구매내역 상세 조회
const getApprovedOrder = async (orderId: number) => {
  const order = await orderRepository.getById(orderId);

  if (!order) {
    throw new NotFoundError("해당 주문 내역을 찾을 수 없습니다.");
  }

  return order;
};

export default {
  getApprovedOrders,
  getApprovedOrder,
};
