import orderRepository from "../repositories/order.repository";
import { NotFoundError } from "../types/error";

// 승인된 전체 구매내역 조회
const getApprovedOrders = async (offset: number, limit: number, orderBy: "latest" | "priceLow" | "priceHigh") => {
  const orders = await orderRepository.getApprovedOrders(offset, limit, orderBy);

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
const getApprovedOrder = async (orderId: number) => {
  const order = await orderRepository.getApprovedById(orderId);

  if (!order) {
    throw new NotFoundError("주문이 승인되지 않았거나, 해당 주문 내역을 찾을 수 없습니다.");
  }

  const { user, orderedItems, ...rest } = order;

  const formattedOrder = {
    ...rest,
    requester: order.user.name,
    products: order.orderedItems.flatMap((item) => item.receipt),
  };

  return formattedOrder;
};

export default {
  getApprovedOrders,
  getApprovedOrder,
};
