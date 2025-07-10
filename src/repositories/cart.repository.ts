import prisma from "../lib/prisma";

const getCartItemsByUserId = async (userId: string) => {
  return await prisma.cartItem.findMany({
    where: { userId, deletedAt: null },
    include: {
      product: true,
    },
  });
};

const addCartItem = async (userId: string, productId: number, quantity: number) => {
  return await prisma.cartItem.upsert({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    update: {
      quantity: {
        increment: quantity,
      },
      deletedAt: null,
    },
    create: {
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

export default {
  getCartItemsByUserId,
  addCartItem,
  deleteCartItems,
  deleteCartItemById,
  updateCartItemChecked,
};
