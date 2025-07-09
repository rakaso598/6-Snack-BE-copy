import prisma from "../lib/prisma";

const getCartItemsByUserId = async (userId: string) => {
  return await prisma.cartItem.findMany({
    where: { userId, deletedAt: null },
    include: {
      product: true,
    },
  });
};

// 기존 방식 find, create 사용 upsert사용시 해당 부분 삭제
const addCartItem = async (userId: string, productId: number, quantity: number) => {
  const existing = await prisma.cartItem.findFirst({
    where: { userId, productId, deletedAt: null },
  });

  if (existing) {
    return await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: { increment: quantity },
        deletedAt: null,
      },
    });
  }

  return await prisma.cartItem.create({
    data: {
      userId,
      productId,
      quantity,
    },
  });
};

/*
cartItem 에서 unique 적용 후 사용 가능 upsert를 사용하는 방법 

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
*/
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
