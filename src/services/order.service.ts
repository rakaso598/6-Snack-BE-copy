import { Company, Order } from "@prisma/client";
import orderRepository from "../repositories/order.repository";
import { NotFoundError, ValidationError, ForbiddenError, BadRequestError } from "../types/error";
import { TGetOrdersQuery, TOrderWithBudget } from "../types/order.types";
import budgetRepository from "../repositories/budget.repository";
import getDateForBudget from "../utils/getDateForBudget";
import prisma from "../config/prisma";
import productRepository from "../repositories/product.repository";

// 구매내역 조회(대기 or 승인)
const getOrders = async ({ page, limit, orderBy, status }: TGetOrdersQuery, companyId: number) => {
  const offset = (page - 1) * limit;

  const orders = await orderRepository.getOrders({ offset, limit, orderBy, status }, companyId);

  if (!orders) {
    throw new NotFoundError("주문 내역을 찾을 수 없습니다.");
  }

  const totalCount = await orderRepository.getOrdersTotalCount({ status }, companyId);

  const formattedOrders = orders.map(({ user, receipts, ...rest }) => {
    // 주문 상품이 1개 이상일 때
    if (receipts.length >= 2) {
      return {
        ...rest,
        requester: user.name,
        productName: `${receipts[0].productName} 외 ${receipts.length - 1}건`,
      };
    }

    // 주문 상품이 1개일 때
    return { ...rest, requester: user.name, productName: receipts[0].productName };
  });

  return {
    orders: formattedOrders,
    meta: { totalCount, itemsPerPage: limit, totalPages: Math.ceil(totalCount / limit), currentPage: page },
  };
};

// 구매내역 상세 조회(대기 or 승인)
const getOrder = async (orderId: Order["id"], status: "pending" | "approved", companyId: number) => {
  const order = await orderRepository.getOrderByIdAndStatus(orderId, status, companyId);

  if (!order) {
    throw new NotFoundError("주문 내역을 찾을 수 없습니다.");
  }

  const { receipts, ...rest } = order;

  let formattedOrder: TOrderWithBudget = {
    ...rest,
    requester: order.user.name,
    products: order.receipts,
    budget: { currentMonthBudget: null, currentMonthExpense: null },
  };

  if (status === "pending") {
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
const updateOrder = async (
  orderId: Order["id"],
  companyId: Company["id"],
  body: Pick<Order, "approver" | "adminMessage" | "status">,
) => {
  const { year, month } = getDateForBudget();

  // 1. Order 조회
  const order = await orderRepository.getOrderById(orderId);

  if (!order) throw new NotFoundError("주문을 찾을 수 없습니다.");

  return await prisma.$transaction(async (tx) => {
    // 2. Order 상태 업데이트(승인 or 반려)
    const updatedOrder = await orderRepository.updateOrder(orderId, body, tx);

    // 2-1. 반려일 때 얼리 리턴
    if (body.status === "REJECTED") return updatedOrder;

    // 3. 예산 조회
    const monthlyBudget = await budgetRepository.getMonthlyBudget({ companyId, year, month });

    if (!monthlyBudget) throw new NotFoundError("예산이 존재하지 않습니다.");

    if (monthlyBudget.currentMonthBudget < monthlyBudget.currentMonthExpense + updatedOrder.totalPrice + 3000)
      throw new BadRequestError("예산이 부족합니다.");

    const totalCurrentMonthExpense = monthlyBudget.currentMonthExpense + updatedOrder.totalPrice + 3000;

    // 4. 지출액 증가
    await budgetRepository.updateCurrentMonthExpense({ companyId, year, month }, totalCurrentMonthExpense, tx);

    const productIds = order.receipts.map((receipt) => receipt.productId);

    // 5. 상품 판매 횟수 증가
    await productRepository.updateCumulativeSales(productIds, tx);

    return updatedOrder;
  });
};

// OrderRequest 관련 기능들 추가
const createOrder = async (orderData: {
  userId: string;
  companyId: number;
  adminMessage?: string;
  requestMessage?: string;
  cartItemIds: number[];
}) => {
  // 입력값 검증
  if (!orderData.userId) {
    throw new ValidationError("사용자 ID는 필수입니다.");
  }

  if (!orderData.cartItemIds || orderData.cartItemIds.length === 0) {
    throw new ValidationError("카트 아이템이 필요합니다.");
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
    throw new NotFoundError("주문을 찾을 수 없습니다.");
  }

  if (order.userId !== userId) {
    throw new ForbiddenError("해당 주문에 접근할 권한이 없습니다.");
  }

  return order;
};

const getOrdersByUserId = async (userId: string) => {
  return await orderRepository.getOrdersByUserId(userId);
};

const cancelOrder = async (orderId: number, userId: string) => {
  const order = await orderRepository.getOrderById(orderId);

  if (!order) {
    throw new NotFoundError("주문을 찾을 수 없습니다.");
  }

  if (order.userId !== userId) {
    throw new ForbiddenError("해당 주문에 접근할 권한이 없습니다.");
  }

  if (order.status !== "PENDING") {
    throw new BadRequestError("대기 중인 주문만 취소할 수 있습니다.");
  }

  return await orderRepository.updateOrderStatus(orderId, "CANCELED");
};

// 즉시 구매
const createInstantOrder = async (orderData: { userId: string; cartItemIds: number[]; companyId: number }) => {
  // 입력값 검증
  if (!orderData.userId) {
    throw new ValidationError("사용자 ID는 필수입니다.");
  }

  if (!orderData.cartItemIds || orderData.cartItemIds.length === 0) {
    throw new ValidationError("카트 아이템이 필요합니다.");
  }

  // 트랜잭션으로 즉시 구매 주문 생성
  const result = await prisma.$transaction(async (tx) => {
    const instantOrderData = {
      ...orderData,
      adminMessage: undefined,
      requestMessage: undefined,
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
