import { PrismaClient } from '@prisma/client';
import orderRequestRepository from '../repositories/orderRequest.repository';
import orderService from './order.service';
import type { TCreateOrderRequest, TCreateInstantOrderRequest, TCreateOrderResponse } from '../types/orderRequest.types';
import { BadRequestError, NotFoundError, ValidationError, ForbiddenError } from '../types/error';

const prisma = new PrismaClient();

const createOrder = async (orderData: TCreateOrderRequest): Promise<TCreateOrderResponse> => {
  // 입력값 검증
  if (!orderData.userId) {
    throw new ValidationError('사용자 ID는 필수입니다.');
  }

  if (!orderData.cartItemIds || orderData.cartItemIds.length === 0) {
    throw new NotFoundError('카트 아이템이 필요합니다.');
  }

  // 트랜잭션으로 주문 생성
  const result = await prisma.$transaction(async (tx) => {
    const order = await orderRequestRepository.createOrder(orderData, tx);
    return order;
  });

  return result;
};

const getOrderById = async (orderId: number, userId: string) => {
  const order = await orderRequestRepository.getOrderById(orderId);

  if (!order) {
    throw new NotFoundError('주문을 찾을 수 없습니다.');
  }

  if (order.userId !== userId) {
    throw new ForbiddenError('해당 주문에 접근할 권한이 없습니다.');
  }

  return order;
};

const getOrdersByUserId = async (userId: string) => {
  return await orderRequestRepository.getOrdersByUserId(userId);
};

const cancelOrder = async (orderId: number, userId: string) => {
  const order = await orderRequestRepository.getOrderById(orderId);

  if (!order) {
    throw new NotFoundError('주문을 찾을 수 없습니다.');
  }

  if (order.userId !== userId) {
    throw new ForbiddenError('해당 주문에 접근할 권한이 없습니다.');
  }

  if (order.status !== 'PENDING') {
    throw new BadRequestError('대기 중인 주문만 취소할 수 있습니다.');
  }

  return await orderRequestRepository.updateOrderStatus(orderId, 'CANCELED');
};

//즉시 구매 
const createInstantOrder = async (orderData: TCreateInstantOrderRequest): Promise<TCreateOrderResponse> => {
  // 입력값 검증
  if (!orderData.userId) {
    throw new ValidationError('사용자 ID는 필수입니다.');
  }

  if (!orderData.cartItemIds || orderData.cartItemIds.length === 0) {
    throw new ValidationError('카트 아이템이 필요합니다.');
  }

  // 트랜잭션으로 즉시 구매 주문 생성
  const result = await prisma.$transaction(async (tx) => {
    const instantOrderData = {
      ...orderData,
      adminMessage: undefined,
      requestMessage: undefined
    };
    
    // 주문 생성
    const order = await orderRequestRepository.createOrder(instantOrderData, tx);
    
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