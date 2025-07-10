import { Order, Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { TGetOrdersQuery, TGetOrderStatus } from "../types/order.types";

const getOrders = async ({ offset, limit, orderBy, status }: TGetOrdersQuery) => {
  const sortOptions: Record<"latest" | "priceLow" | "priceHigh", Prisma.OrderOrderByWithRelationInput> = {
    latest: { createdAt: "desc" },
    priceLow: { totalPrice: "asc" },
    priceHigh: { totalPrice: "desc" },
  };

  const statusOptions: TGetOrderStatus = {
    pending: "PENDING",
    approved: "APPROVED",
  };

  return await prisma.order.findMany({
    where: { status: statusOptions[status] },
    skip: offset,
    take: limit,
    orderBy: sortOptions[orderBy] || sortOptions["latest"],
    include: {
      user: true,
      orderedItems: { include: { receipt: true } },
    },
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

export default {
  getOrders,
  getOrderByIdAndStatus,
  getOrderById,
  updateOrder,
};
