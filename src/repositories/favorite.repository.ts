import prisma from "../config/prisma";
import { Like, Product, User } from "@prisma/client";

const getFavorites = async (userId: User["id"]): Promise<Like[]> => {
  return await prisma.like.findMany({
    where: { userId },
    include: { product: true },
  });
};

const createFavorite = async (userId: User["id"], productId: Product["id"]) => {
  return await prisma.like.create({
    data: { userId, productId },
  });
};

const deleteFavorite = async (userId: User["id"], productId: Product["id"]) => {
  // return await prisma.like.delete({
  //   where: { userId, productId },
  // });
};

export default {
  getFavorites,
  createFavorite,
  deleteFavorite,
};
