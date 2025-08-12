import { Company, Order, Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { TGetOrdersQuery, TGetOrdersRepositoryQuery, TGetOrderStatus } from "../types/order.types";
import { AuthenticationError } from "../types/error";

const SORT_OPTIONS: Record<"latest" | "priceLow" | "priceHigh", Prisma.OrderOrderByWithRelationInput> = {
  latest: { createdAt: "desc" },
  priceLow: { productsPriceTotal: "asc" },
  priceHigh: { productsPriceTotal: "desc" },
};

const STATUS_OPTIONS: TGetOrderStatus = {
  pending: "PENDING",
  approved: ["APPROVED", "INSTANT_APPROVED"],
};

const getStatusCondition = (status: keyof TGetOrderStatus) => {
  const statusValue = STATUS_OPTIONS[status];
  return Array.isArray(statusValue) ? { status: { in: statusValue } } : { status: statusValue };
};

// 주문 목록 조회
const getOrders = async ({ offset, limit, orderBy, status }: TGetOrdersRepositoryQuery, companyId: Company["id"]) => {
  const statusOptions = getStatusCondition(status);

  return await prisma.order.findMany({
    where: { ...statusOptions, companyId },
    skip: offset,
    take: limit,
    orderBy: SORT_OPTIONS[orderBy] || SORT_OPTIONS["latest"],
    include: {
      user: { omit: { hashedRefreshToken: true, password: true } },
      receipts: true,
    },
  });
};

// 주문 목록 총 갯수 조회
const getOrdersTotalCount = async ({ status }: Pick<TGetOrdersQuery, "status">, companyId: Company["id"]) => {
  const statusOptions = getStatusCondition(status);

  return await prisma.order.count({
    where: { ...statusOptions, companyId },
  });
};

// 주문 조회(대기 or 승인)
const getOrderByIdAndStatus = async (id: Order["id"], status: "pending" | "approved", companyId: Company["id"]) => {
  const statusOptions = getStatusCondition(status);

  return await prisma.order.findFirst({
    where: { id, ...statusOptions, companyId },
    include: {
      user: { omit: { hashedRefreshToken: true, password: true } },
      receipts: true,
    },
  });
};

// 주문 조회(단건)
const getOrderById = async (id: Order["id"]) => {
  return await prisma.order.findUnique({
    where: { id },
    include: {
      user: { omit: { hashedRefreshToken: true, password: true } },
      receipts: true,
    },
  });
};

const getOrderWithCartItemIdsById = async (id: Order["id"]) => {
  return await prisma.order.findUnique({
    where: { id },
    include: {
      receipts: true,
    },
  });
};

const updateOrder = async (
  id: Order["id"],
  body: Pick<Order, "approver" | "adminMessage" | "status">,
  tx?: Prisma.TransactionClient,
) => {
  const { approver, adminMessage, status } = body;
  const client = tx || prisma;

  return await client.order.update({
    where: { id },
    data: { approver, adminMessage, status },
  });
};

const revertOrder = async (id: Order["id"]) => {
  return await prisma.order.update({
    where: { id },
    data: { adminMessage: null, status: "PENDING", approver: null },
  });
};

const deleteReceiptAndOrder = async (orderId: Order["id"], tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;

  // 1. receipt 삭제
  await client.receipt.deleteMany({
    where: { orderId },
  });

  // 2. order 삭제
  await client.order.delete({
    where: { id: orderId },
  });
};

// OrderRequest 관련 기능들 추가
const createOrder = async (
  orderData: {
    userId: string;
    companyId: number;
    adminMessage?: string;
    requestMessage?: string;
    cartItemIds: number[];
  },
  tx?: Prisma.TransactionClient,
) => {
  const client = tx || prisma;

  // 1. 카트 아이템들을 가져와서 receipt 생성
  const cartItems = await client.cartItem.findMany({
    where: {
      id: { in: orderData.cartItemIds },
    },
    include: {
      product: true,
    },
  });

  if (cartItems.length !== orderData.cartItemIds.length) {
    throw new Error("일부 카트 아이템을 찾을 수 없습니다.");
  }

  // 2. 총 가격 계산
  const totalPrice = cartItems.reduce((sum, cartItem) => {
    return sum + cartItem.product.price * cartItem.quantity;
  }, 0);

  // 2-1. 유저 역할 확인
  const user = await client.user.findUnique({
    where: { id: orderData.userId },
    select: { role: true },
  });

  if (!user) throw new AuthenticationError("로그인이 필요합니다.");

  // 3. 주문 생성
  const order = await client.order.create({
    data: {
      userId: orderData.userId,
      companyId: orderData.companyId,
      adminMessage: orderData.adminMessage,
      requestMessage: orderData.requestMessage,
      productsPriceTotal: totalPrice,
      deliveryFee: 3000,
      status: user.role === "USER" ? "PENDING" : "INSTANT_APPROVED",
    },
  });

  // 4. 각 카트 아이템으로부터 receipt 생성
  const receipts = await Promise.all(
    cartItems.map(async (cartItem) => {
      return await client.receipt.create({
        data: {
          productId: cartItem.productId,
          orderId: order.id,
          productName: cartItem.product.name,
          price: cartItem.product.price,
          imageUrl: cartItem.product.imageUrl,
          quantity: cartItem.quantity,
        },
      });
    }),
  );

  // 5. 주문에 포함된 카트 아이템들을 장바구니에서 삭제
  await client.cartItem.updateMany({
    where: {
      id: { in: orderData.cartItemIds },
    },
    data: {
      deletedAt: new Date(),
    },
  });

  // 6. 생성된 주문 정보 반환
  const result = await client.order.findUnique({
    where: { id: order.id },
    include: {
      receipts: {
        select: {
          id: true,
          productName: true,
          price: true,
          imageUrl: true,
          quantity: true,
        },
      },
    },
  });

  if (!result) {
    throw new Error("생성된 주문을 찾을 수 없습니다.");
  }

  return result;
};

const getOrdersByUserId = async (userId: string, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;

  return await client.order.findMany({
    where: { userId },
    include: {
      receipts: {
        select: {
          id: true,
          productName: true,
          price: true,
          imageUrl: true,
          quantity: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const updateOrderStatus = async (
  orderId: Order["id"],
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED",
  tx?: Prisma.TransactionClient,
) => {
  const client = tx || prisma;

  try {
    const updatedOrder = await client.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        receipts: {
          select: {
            id: true,
            productName: true,
            price: true,
            imageUrl: true,
            quantity: true,
          },
        },
      },
    });

    return updatedOrder;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new Error(`ID ${orderId}인 주문을 찾을 수 없습니다.`);
    }
    throw error;
  }
};

export default {
  getOrders,
  getOrdersTotalCount,
  getOrderByIdAndStatus,
  getOrderById,
  getOrderWithCartItemIdsById,
  updateOrder,
  revertOrder,
  deleteReceiptAndOrder,
  // OrderRequest 관련 기능들
  createOrder,
  getOrdersByUserId,
  updateOrderStatus,
};
