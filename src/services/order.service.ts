import { Order } from "@prisma/client";
import orderRepository from "../repositories/order.repository";
import { NotFoundError } from "../types/error";
import { TGetOrdersQuery, TOrderWithBudget } from "../types/order.types";
import budgetRepository from "../repositories/budget.repository";
import getDateForBudget from "../utils/date";

// 구매내역 조회(대기 or 승인)
const getOrders = async ({ offset, limit, orderBy, status }: TGetOrdersQuery) => {
  const orders = await orderRepository.getOrders({ offset, limit, orderBy, status });

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

// 구매내역 상세 조회(대기 or 승인)
const getOrder = async (orderId: Order["id"], status: "pending" | "approved") => {
  const order = await orderRepository.getOrderByIdAndStatus(orderId, status);

  if (!order) {
    throw new NotFoundError("주문 내역을 찾을 수 없습니다.");
  }

  const { user, orderedItems, ...rest } = order;

  let formattedOrder: TOrderWithBudget = {
    ...rest,
    requester: order.user.name,
    products: order.orderedItems.map((item) => item.receipt),
    budget: { currentMonthBudget: null, currentMonthExpense: null },
  };

  if (status === "pending") {
    const companyId = user.companyId;
    const { year, month } = getDateForBudget();

    const budget = await budgetRepository.getMonthlyBudget({ companyId, year, month });

    if (!budget) {
      throw new NotFoundError("예산을 조회할 수 없습니다. 예산을 생성해주세요.");
    }

    const { currentMonthBudget, currentMonthExpense } = budget;

    return (formattedOrder = {
      ...formattedOrder,
      budget: { currentMonthBudget, currentMonthExpense },
    });
  }

  return formattedOrder;
};

// 구매 승인 | 구매 반려
const updateOrder = async (orderId: Order["id"], body: Pick<Order, "approver" | "adminMessage" | "status">) => {
  const order = await orderRepository.getOrderById(orderId);

  if (!order) {
    throw new NotFoundError("주문을 찾을 수 없습니다.");
  }

  const updatedOrder = await orderRepository.updateOrder(orderId, body);

  return updatedOrder;
};

export default {
  getOrders,
  getOrder,
  updateOrder,
};
