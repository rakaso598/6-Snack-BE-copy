import { Order } from "@prisma/client";
import orderRepository from "../repositories/order.repository";
import { NotFoundError, ValidationError, ForbiddenError, BadRequestError } from "../types/error";
import { TGetOrdersQuery, TOrderWithBudget } from "../types/order.types";
import budgetRepository from "../repositories/budget.repository";
import getDateForBudget from "../utils/getDateForBudget";
import prisma from "../config/prisma";

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

// OrderRequest 관련 기능들 추가
const createOrder = async (orderData: {
  userId: string;
  adminMessage?: string;
  requestMessage?: string;
  cartItemIds: number[];
}) => {
  // 입력값 검증
  if (!orderData.userId) {
    throw new ValidationError('사용자 ID는 필수입니다.');
  }

  if (!orderData.cartItemIds || orderData.cartItemIds.length === 0) {
    throw new ValidationError('카트 아이템이 필요합니다.');
  }

  // 트랜잭션으로 주문 생성
  const result = await prisma.$transaction(async (tx) => {
    const order = await orderRepository.createOrder(orderData, tx);
    return order;
  });

  return result;
};

const getOrderById = async (orderId: number, userId: string) => {
  const order = await orderRepository.getOrderById(orderId);

  if (!order) {
    throw new NotFoundError('주문을 찾을 수 없습니다.');
  }

  if (order.userId !== userId) {
    throw new ForbiddenError('해당 주문에 접근할 권한이 없습니다.');
  }

  return order;
};

const getOrdersByUserId = async (userId: string) => {
  return await orderRepository.getOrdersByUserId(userId);
};

const cancelOrder = async (orderId: number, userId: string) => {
  const order = await orderRepository.getOrderById(orderId);

  if (!order) {
    throw new NotFoundError('주문을 찾을 수 없습니다.');
  }

  if (order.userId !== userId) {
    throw new ForbiddenError('해당 주문에 접근할 권한이 없습니다.');
  }

  if (order.status !== 'PENDING') {
    throw new BadRequestError('대기 중인 주문만 취소할 수 있습니다.');
  }

  return await orderRepository.updateOrderStatus(orderId, 'CANCELED');
};

// 즉시 구매
const createInstantOrder = async (orderData: {
  userId: string;
  cartItemIds: number[];
}) => {
  // 입력값 검증
  if (!orderData.userId) {
    throw new ValidationError('사용자 ID는 필수입니다.');
  }

  if (!orderData.cartItemIds || orderData.cartItemIds.length === 0) {
    throw new ValidationError('카트 아이템이 필요합니다.');
  }

  // 트랜잭션으로 즉시 구매 주문 생성
  const result = await prisma.$transaction(async (tx) => {
    const instantOrderData = {
      ...orderData,
      adminMessage: undefined,
      requestMessage: undefined
    };
    
    // 주문 생성
    const order = await orderRepository.createOrder(instantOrderData, tx);
    
    return order;
  });

  return result;
};

export default {
  getOrders,
  getOrder,
  updateOrder,
  // OrderRequest 관련 기능들
  createOrder,
  getOrderById,
  getOrdersByUserId,
  cancelOrder,
  createInstantOrder,
};
