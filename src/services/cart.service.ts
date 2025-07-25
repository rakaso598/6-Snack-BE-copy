import cartRepository from "../repositories/cart.repository";
import { TAddToCartDto, TDeleteCartItemsDto, TToggleCheckDto } from "../dtos/cart.dto";
import { BadRequestError, NotFoundError } from "../types/error";
import prisma from "../lib/prisma";

const getMyCart = async (userId: string, onlySelected: boolean) => {
  return await prisma.cartItem.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(onlySelected && { isChecked: true }),
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc", // 최신순 정렬
    },
  });
};

const getCartItemById = async (userId: string, itemId: number) => {
  const item = await cartRepository.findCartItemById(userId, itemId);
  if (!item) {
    throw new NotFoundError("장바구니 항목을 찾을 수 없습니다.");
  }
  return item;
};

const addToCart = async (userId: string, dto: TAddToCartDto) => {
  if (dto.quantity <= 0) {
    throw new BadRequestError("수량은 1 이상이어야 합니다.");
  }
  return await cartRepository.addCartItem(userId, dto.productId, dto.quantity);
};

const deleteSelectedItems = async (userId: string, dto: TDeleteCartItemsDto) => {
  if (!dto.itemIds || dto.itemIds.length === 0) {
    throw new BadRequestError("삭제할 항목이 없습니다.");
  }
  return await cartRepository.deleteCartItems(userId, dto.itemIds);
};

const deleteCartItem = async (userId: string, itemId: number) => {
  const deleted = await cartRepository.deleteCartItemById(userId, itemId);
  if (deleted.count === 0) {
    throw new NotFoundError("장바구니 항목을 찾을 수 없습니다.");
  }
};

const toggleCheckCartItem = async (userId: string, itemId: number, dto: TToggleCheckDto) => {
  const updated = await cartRepository.updateCartItemChecked(userId, itemId, dto.isChecked);
  if (updated.count === 0) {
    throw new NotFoundError("장바구니 항목을 찾을 수 없습니다.");
  }
};

const toggleAllCheck = async (userId: string, isChecked: boolean) => {
  await cartRepository.updateAllCartItemsChecked(userId, isChecked);
};

const updateQuantity = async (userId: string, itemId: number, quantity: number) => {
  if (quantity <= 0) {
    throw new BadRequestError("수량은 1 이상이어야 합니다.");
  }

  const updated = await cartRepository.updateCartItemQuantity(userId, itemId, quantity);

  if (updated.count === 0) {
    throw new NotFoundError("장바구니 항목을 찾을 수 없습니다.");
  }
};

export default {
  getMyCart,
  getCartItemById,
  addToCart,
  deleteSelectedItems,
  deleteCartItem,
  toggleCheckCartItem,
  toggleAllCheck,
  updateQuantity,
};
