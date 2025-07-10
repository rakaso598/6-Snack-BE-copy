import { Order } from "@prisma/client";
import orderRepository from "../repositories/order.repository";
import { NotFoundError } from "../types/error";
import { TApprovedOrderQuery } from "../types/order.types";

// 승인된 전체 구매내역 조회
const getApprovedOrders = async ({ offset, limit, orderBy }: TApprovedOrderQuery) => {
  const orders = await orderRepository.getApprovedOrders({ offset, limit, orderBy });

  if (!orders) {
    throw new NotFoundError("주문 내역을 찾을 수 없습니다.");
  }

  const formattedOrders = orders.map(({ user, orderedItems, ...rest }) => {
    // 주문 상품이 1개 이상일 때
    if (orderedItems.length >= 2) {
      return { ...rest, requester: user.name, productName: `${orderedItems[0].receipt.productName} 외 1건` };
    }

    // 주문 상품이 1개일 때
    return { ...rest, requester: user.name, productName: orderedItems[0].receipt.productName };
  });

  return formattedOrders;
};

// 승인된 구매내역 상세 조회
const getApprovedOrder = async (orderId: Order["id"]) => {
  const order = await orderRepository.getApprovedById(orderId);

  if (!order) {
    throw new NotFoundError("주문이 승인되지 않았거나, 해당 주문 내역을 찾을 수 없습니다.");
  }

  const { user, orderedItems, ...rest } = order;

  const formattedOrder = {
    ...rest,
    requester: order.user.name,
    products: order.orderedItems.map((item) => item.receipt),
  };

  return formattedOrder;
};

// 구매 승인 | 구매 반려
const updateOrder = async (orderId: Order["id"], body: Pick<Order, "approver" | "adminMessage" | "status">) => {
  const order = await orderRepository.getById(orderId);

  if (!order) {
    throw new NotFoundError("주문을 찾을 수 없습니다.");
  }

  const updatedOrder = await orderRepository.updateOrder(orderId, body);

  return updatedOrder;
};

export default {
  getApprovedOrders,
  getApprovedOrder,
  updateOrder,
};
