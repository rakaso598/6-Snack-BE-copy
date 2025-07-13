import { Request, Response, NextFunction } from 'express';
import orderRequestService from '../services/orderRequest.service';
import orderService from '../services/order.service';
import type { TCreateOrderRequest, TCreateInstantOrderRequest } from '../types/orderRequest.types';
import { AuthenticationError } from '../types/error';

const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderData: TCreateOrderRequest = req.body;
    
    if (!req.user?.id) {
      throw new AuthenticationError('로그인이 필요합니다.');
    }
    
    // 인증된 사용자의 ID를 사용
    const authenticatedOrderData: TCreateOrderRequest = {
      ...orderData,
      userId: req.user.id
    };
    
    const result = await orderRequestService.createOrder(authenticatedOrderData);
    
    res.status(201).json({
      message: '구매 요청이 성공적으로 생성되었습니다.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    if (!req.user?.id) {
      throw new AuthenticationError('로그인이 필요합니다.');
    }
    
    const result = await orderRequestService.getOrderById(orderId, req.user.id);
    
    res.status(200).json({
      message: '구매 요청 조회가 완료되었습니다.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getOrdersByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AuthenticationError('로그인이 필요합니다.');
    }

    const result = await orderRequestService.getOrdersByUserId(req.user.id);

    res.status(200).json({
      message: '구매 요청 목록 조회가 완료되었습니다.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;
    
    if (!req.user?.id) {
      throw new AuthenticationError('로그인이 필요합니다.');
    }
    
    if (status !== 'CANCELED') {
      res.status(400).json({
        message: '취소 요청은 CANCELED 상태만 가능합니다.'
      });
      return;
    }
    
    const result = await orderRequestService.cancelOrder(orderId, req.user.id);
    
    res.status(200).json({
      message: '구매 요청이 성공적으로 취소되었습니다.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const createInstantOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderData = req.body;
    
    if (!req.user?.id) {
      throw new AuthenticationError('로그인이 필요합니다.');
    }
    
    // 인증된 사용자의 ID를 사용 (메시지 필드 제거)
    const authenticatedOrderData: TCreateInstantOrderRequest = {
      cartItemIds: orderData.cartItemIds,
      userId: req.user.id
    };
    
    // 1. 주문 생성
    const result = await orderRequestService.createInstantOrder(authenticatedOrderData);
    
    // 2. orderService를 사용하여 승인 처리
    const approvedOrder = await orderService.updateOrder(result.id, {
      adminMessage: '즉시 구매로 자동 승인',
      status: 'APPROVED'
    });
    
    res.status(201).json({
      message: '즉시 구매가 성공적으로 완료되었습니다.',
      data: approvedOrder
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createOrder,
  getOrderById,
  getOrdersByUserId,
  cancelOrder,
  createInstantOrder
}; 