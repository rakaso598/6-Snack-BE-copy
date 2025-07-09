import { Order } from "@prisma/client";
import prisma from "../config/prisma";

const getApprovedOrders = async () => {
  return await prisma.order.findMany({
    where: { status: "APPROVED" },
  });
};

const getById = async (id: Order["id"]) => {
  return await prisma.order.findUnique({
    where: { id },
  });
};

export default {
  getApprovedOrders,
  getById,
};
