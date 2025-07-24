import { Order, OrderStatus, Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { TGetOrdersQuery, TGetOrderStatus } from "../types/order.types";

const SORT_OPTIONS: Record<"latest" | "priceLow" | "priceHigh", Prisma.OrderOrderByWithRelationInput> = {
  latest: { createdAt: "desc" },
  priceLow: { totalPrice: "asc" },
  priceHigh: { totalPrice: "desc" },
};

const STATUS_OPTIONS: TGetOrderStatus = {
  pending: "PENDING",
  approved: "APPROVED",
};

const getOrders = async ({ offset, limit, orderBy, status }: TGetOrdersQuery) => {
  return await prisma.order.findMany({
    where: { status: STATUS_OPTIONS[status] },
    skip: offset,
    take: limit,
    orderBy: SORT_OPTIONS[orderBy] || SORT_OPTIONS["latest"],
    include: {
      user: true,
      orderedItems: { include: { receipt: true } },
    },
  });
};

const getOrdersTotalCount = async ({ status }: Pick<TGetOrdersQuery, "status">) => {
  return await prisma.order.count({
    where: { status: STATUS_OPTIONS[status] },
  });
};

const getOrderByIdAndStatus = async (id: Order["id"], status: "pending" | "approved") => {
  const statusOptions: TGetOrderStatus = {
    pending: "PENDING",
    approved: "APPROVED",
  };

  return await prisma.order.findFirst({
    where: { id, status: statusOptions[status] },
    include: {
      user: true,
      orderedItems: { include: { receipt: true } },
    },
  });
};

const getOrderById = async (id: Order["id"]) => {
  return await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      orderedItems: { include: { receipt: true } },
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

// OrderRequest 관련 기능들 추가
const createOrder = async (
  orderData: {
    userId: string;
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

  // 2. 각 카트 아이템으로부터 receipt 생성
  const receipts = await Promise.all(
    cartItems.map(async (cartItem) => {
      return await client.receipt.create({
        data: {
          productName: cartItem.product.name,
          price: cartItem.product.price,
          imageUrl: cartItem.product.imageUrl,
          quantity: cartItem.quantity,
        },
      });
    }),
  );

  // 3. 총 가격 계산
  const totalPrice = receipts.reduce((sum, receipt) => {
    return sum + receipt.price * receipt.quantity;
  }, 0);

  // 4. 주문 생성
  const order = await client.order.create({
    data: {
      userId: orderData.userId,
      adminMessage: orderData.adminMessage,
      requestMessage: orderData.requestMessage,
      totalPrice: totalPrice,
      status: "PENDING",
    },
  });

  // 5. OrderedItem 생성 (주문과 receipt 연결)
  await Promise.all(
    receipts.map(async (receipt, index) => {
      return await client.orderedItem.create({
        data: {
          orderId: order.id,
          receiptId: receipt.id,
          productId: cartItems[index].productId,
        },
      });
    }),
  );

  // 6. 생성된 주문 정보 반환
  const result = await client.order.findUnique({
    where: { id: order.id },
    include: {
      orderedItems: {
        include: {
          receipt: {
            select: {
              id: true,
              productName: true,
              price: true,
              imageUrl: true,
              quantity: true,
            },
          },
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
      orderedItems: {
        include: {
          receipt: {
            select: {
              id: true,
              productName: true,
              price: true,
              imageUrl: true,
              quantity: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const updateOrderStatus = async (
  orderId: number,
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED",
  tx?: Prisma.TransactionClient,
) => {
  const client = tx || prisma;

  try {
    const updatedOrder = await client.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        orderedItems: {
          include: {
            receipt: {
              select: {
                id: true,
                productName: true,
                price: true,
                imageUrl: true,
                quantity: true,
              },
            },
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
  updateOrder,
  // OrderRequest 관련 기능들
  createOrder,
  getOrdersByUserId,
  updateOrderStatus,
};
