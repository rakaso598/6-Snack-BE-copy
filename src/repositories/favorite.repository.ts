import prisma from "../config/prisma";
import { Product, User } from "@prisma/client";
import { TGetFavoritesRepositoryQuery } from "../types/favorite.types";

const getFavorites = async (userId: User["id"], params: TGetFavoritesRepositoryQuery) => {
  const { offset, limit } = params;

  return await prisma.favorite.findMany({
    where: { userId },
    skip: offset,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      product: { include: { category: true, creator: { select: { id: true, email: true, name: true, role: true } } } },
    },
  });
};

const getFavoritesTotalCount = async (userId: User["id"]) => {
  return await prisma.favorite.count({
    where: { userId },
  });
};

const getFavorite = async (userId: User["id"], productId: Product["id"]) => {
  return await prisma.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
  });
};

const createFavorite = async (userId: User["id"], productId: Product["id"]) => {
  return await prisma.favorite.create({
    data: { userId, productId },
  });
};

const deleteFavorite = async (userId: User["id"], productId: Product["id"]) => {
  return await prisma.favorite.delete({
    where: { userId_productId: { userId, productId } },
  });
};

export default {
  getFavorites,
  getFavoritesTotalCount,
  getFavorite,
  createFavorite,
  deleteFavorite,
};
