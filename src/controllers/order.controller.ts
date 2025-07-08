import { Request, Response, NextFunction } from 'express';
import orderService from '../services/order.service';
import type { TCreateOrderRequest } from '../types/order.types';

const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderData: TCreateOrderRequest = req.body;
    
    // TODO: 실제 인증 미들웨어에서 userId를 가져와야 함
    // 현재는 임시로 body에서 가져옴
    const result = await orderService.createOrder(orderData);
    
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
    const userId = req.body.userId; // TODO: 실제 인증 미들웨어에서 가져와야 함
    
    const result = await orderService.getOrderById(orderId, userId);
    
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
    const userId = req.body.userId; // body에서 userId 추출

    if (!userId) {
      res.status(400).json({ message: 'userId가 필요합니다.' });
      return;
    }

    const result = await orderService.getOrdersByUserId(userId);

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
    const userId = req.body.userId; // TODO: 실제 인증 미들웨어에서 가져와야 함
    const { status } = req.body;
    
    if (status !== 'CANCELED') {
      res.status(400).json({
        message: '취소 요청은 CANCELED 상태만 가능합니다.'
      });
      return;
    }
    
    const result = await orderService.cancelOrder(orderId, userId);
    
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
    
    // TODO: 실제 인증 미들웨어에서 userId를 가져와야 함
    const result = await orderService.createInstantOrder(orderData);
    
    res.status(201).json({
      message: '즉시 구매가 성공적으로 완료되었습니다.',
      data: result
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