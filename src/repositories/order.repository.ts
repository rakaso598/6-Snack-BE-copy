import { Order, Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { TApprovedOrderQuery } from "../types/order.types";

const getApprovedOrders = async ({ offset, limit, orderBy }: TApprovedOrderQuery) => {
  const sortOptions: Record<"latest" | "priceLow" | "priceHigh", Prisma.OrderOrderByWithRelationInput> = {
    latest: { createdAt: "desc" },
    priceLow: { totalPrice: "asc" },
    priceHigh: { totalPrice: "desc" },
  };

  return await prisma.order.findMany({
    where: { status: "APPROVED" },
    skip: offset,
    take: limit,
    orderBy: sortOptions[orderBy] || sortOptions["latest"],
    include: {
      user: true,
      orderedItems: { include: { receipt: true } },
    },
  });
};

const getApprovedById = async (id: Order["id"]) => {
  return await prisma.order.findFirst({
    where: { id, status: "APPROVED" },
    include: {
      user: true,
      orderedItems: { include: { receipt: true } },
    },
  });
};

export default {
  getApprovedOrders,
  getApprovedById,
};
