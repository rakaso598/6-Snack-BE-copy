import prisma from "../config/prisma";
import { Product, User } from "@prisma/client";

const getFavorites = async (userId: User["id"]) => {
  return await prisma.like.findMany({
    where: { userId },
    include: {
      product: { include: { category: true, creator: { select: { id: true, email: true, name: true, role: true } } } },
    },
  });
};

const getFavorite = async (userId: User["id"], productId: Product["id"]) => {
  return await prisma.like.findUnique({
    where: { userId_productId: { userId, productId } },
  });
};

const createFavorite = async (userId: User["id"], productId: Product["id"]) => {
  return await prisma.like.create({
    data: { userId, productId },
  });
};

const deleteFavorite = async (userId: User["id"], productId: Product["id"]) => {
  return await prisma.like.delete({
    where: { userId_productId: { userId, productId } },
  });
};

export default {
  getFavorites,
  getFavorite,
  createFavorite,
  deleteFavorite,
};
