import { PrismaClient } from '@prisma/client';
import orderRepository from '../repositories/order.repository';
import type { TCreateOrderRequest, TCreateOrderResponse } from '../types/order.types';
import { BadRequestError, NotFoundError, ValidationError, ForbiddenError } from '../types/error.types';

const prisma = new PrismaClient();

const createOrder = async (orderData: TCreateOrderRequest): Promise<TCreateOrderResponse> => {
  // 입력값 검증
  if (!orderData.userId) {
    throw new ValidationError('사용자 ID는 필수입니다.');
  }

  if (!orderData.cartItemIds || orderData.cartItemIds.length === 0) {
    throw new ValidationError('장바구니 아이템이 필요합니다.');
  }

  if (!orderData.totalPrice || orderData.totalPrice <= 0) {
    throw new ValidationError('총 가격은 0보다 커야 합니다.');
  }

  // 장바구니 아이템들이 실제로 존재하는지 확인
  const cartItems = await prisma.cartItem.findMany({
    where: {
      id: { in: orderData.cartItemIds },
      userId: orderData.userId,
      deletedAt: null
    },
    include: {
      product: true
    }
  });

  if (cartItems.length !== orderData.cartItemIds.length) {
    throw new NotFoundError('일부 장바구니 아이템을 찾을 수 없습니다.');
  }

  // 실제 총 가격 계산 및 검증
  const calculatedTotalPrice = cartItems.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity);
  }, 0);

  if (calculatedTotalPrice !== orderData.totalPrice) {
    throw new BadRequestError('총 가격이 일치하지 않습니다.');
  }

  // 트랜잭션으로 주문 생성
  const result = await prisma.$transaction(async (tx) => {
    const order = await orderRepository.createOrder(orderData, tx);

    // 장바구니 아이템들을 삭제 처리 (soft delete)
    await tx.cartItem.updateMany({
      where: {
        id: { in: orderData.cartItemIds }
      },
      data: {
        deletedAt: new Date()
      }
    });

    return order;
  });

  return result;
};

const getOrderById = async (orderId: number, userId: string) => {
  const order = await orderRepository.getOrderById(orderId);

  if (!order) {
    throw new NotFoundError('주문을 찾을 수 없습니다.');
  }

  if (order.userId !== userId) {
    throw new ForbiddenError('해당 주문에 접근할 권한이 없습니다.');
  }

  return order;
};

const getOrdersByUserId = async (userId: string) => {
  return await orderRepository.getOrdersByUserId(userId);
};

const cancelOrder = async (orderId: number, userId: string) => {
  const order = await orderRepository.getOrderById(orderId);

  if (!order) {
    throw new NotFoundError('주문을 찾을 수 없습니다.');
  }

  if (order.userId !== userId) {
    throw new ForbiddenError('해당 주문에 접근할 권한이 없습니다.');
  }

  if (order.status !== 'PENDING') {
    throw new BadRequestError('대기 중인 주문만 취소할 수 있습니다.');
  }

  return await orderRepository.updateOrderStatus(orderId, 'CANCELED');
};

const createInstantOrder = async (orderData: TCreateOrderRequest): Promise<TCreateOrderResponse> => {
  // 입력값 검증
  if (!orderData.userId) {
    throw new ValidationError('사용자 ID는 필수입니다.');
  }

  if (!orderData.cartItemIds || orderData.cartItemIds.length === 0) {
    throw new ValidationError('장바구니 아이템이 필요합니다.');
  }

  if (!orderData.totalPrice || orderData.totalPrice <= 0) {
    throw new ValidationError('총 가격은 0보다 커야 합니다.');
  }

  // 장바구니 아이템들이 실제로 존재하는지 확인
  const cartItems = await prisma.cartItem.findMany({
    where: {
      id: { in: orderData.cartItemIds },
      userId: orderData.userId,
      deletedAt: null
    },
    include: {
      product: true
    }
  });

  if (cartItems.length !== orderData.cartItemIds.length) {
    throw new NotFoundError('일부 장바구니 아이템을 찾을 수 없습니다.');
  }

  // 실제 총 가격 계산 및 검증
  const calculatedTotalPrice = cartItems.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity);
  }, 0);

  if (calculatedTotalPrice !== orderData.totalPrice) {
    throw new BadRequestError('총 가격이 일치하지 않습니다.');
  }

  // 트랜잭션으로 즉시 구매 주문 생성 (APPROVED 상태로)
  const result = await prisma.$transaction(async (tx) => {
    const instantOrderData = {
      ...orderData,
      status: 'APPROVED' as const
    };
    
    const order = await orderRepository.createOrder(instantOrderData, tx);

    // 장바구니 아이템들을 삭제 처리 (soft delete)
    await tx.cartItem.updateMany({
      where: {
        id: { in: orderData.cartItemIds }
      },
      data: {
        deletedAt: new Date()
      }
    });

    return order;
  });

  return result;
};

export default {
  createOrder,
  getOrderById,
  getOrdersByUserId,
  cancelOrder,
  createInstantOrder
}; 