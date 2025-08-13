import { Prisma, Product, User } from "@prisma/client";
import prisma from "../lib/prisma";

const getCartItemsByUserId = async (userId: string) => {
  return await prisma.cartItem.findMany({
    where: { userId, deletedAt: null },
    include: {
      product: true,
    },
  });
};

const findCartItemById = async (userId: string, cartItemId: number) => {
  return await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      userId,
      deletedAt: null,
    },
    include: {
      product: true,
    },
  });
};

const addCartItem = async (userId: string, productId: number, quantity: number) => {
  const existing = await prisma.cartItem.findFirst({
    where: {
      userId,
      productId,
    },
  });

  if (existing) {
    if (existing.deletedAt) {
      // 복구 + 수량 업데이트
      return await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: quantity,
          deletedAt: null,
          isChecked: true,
        },
      });
    }

    // 기존 항목에 수량 누적
    return await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: {
          increment: quantity,
        },
      },
    });
  }

  // 없으면 새로 생성
  return await prisma.cartItem.create({
    data: {
      userId,
      productId,
      quantity,
    },
  });
};

const deleteCartItems = async (userId: string, itemIds: number[]) => {
  return await prisma.cartItem.updateMany({
    where: {
      id: { in: itemIds },
      userId,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};

const deleteCartItemById = async (userId: string, itemId: number) => {
  return await prisma.cartItem.updateMany({
    where: {
      id: itemId,
      userId,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};

const updateCartItemChecked = async (userId: string, itemId: number, isChecked: boolean) => {
  return await prisma.cartItem.updateMany({
    where: {
      id: itemId,
      userId,
      deletedAt: null,
    },
    data: {
      isChecked,
    },
  });
};

const updateAllCartItemsChecked = async (userId: string, isChecked: boolean) => {
  return await prisma.cartItem.updateMany({
    where: {
      userId,
      deletedAt: null,
    },
    data: {
      isChecked,
    },
  });
};

const updateCartItemQuantity = async (userId: string, itemId: number, quantity: number) => {
  return await prisma.cartItem.updateMany({
    where: {
      id: itemId,
      userId,
      deletedAt: null,
    },
    data: {
      quantity,
    },
  });
};

const revertCartItem = async (userId: User["id"], productIds: Product["id"][], tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;

  return await Promise.all(
    productIds.map(async (productId) => {
      return await client.cartItem.updateMany({
        where: { userId, productId },
        data: { deletedAt: null },
      });
    }),
  );
};

export default {
  getCartItemsByUserId,
  findCartItemById,
  addCartItem,
  deleteCartItems,
  deleteCartItemById,
  updateCartItemChecked,
  updateAllCartItemsChecked,
  updateCartItemQuantity,
  revertCartItem,
};
