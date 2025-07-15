// import { RequestHandler } from 'express';
// import orderRequestService from '../services/orderRequest.service';
// import orderService from '../services/order.service';
// import type { TCreateOrderRequestDto, TCreateInstantOrderRequestDto, TUpdateOrderStatusDto } from '../dtos/orderRequest.dto';
// import { AuthenticationError } from '../types/error';
// import { parseNumberOrThrow } from '../utils/parseNumberOrThrow';

// const createOrder: RequestHandler<{}, {}, TCreateOrderRequestDto> = async (req, res, next) => {
//   try {
//     const orderData: TCreateOrderRequestDto = req.body;
    
//     if (!req.user?.id) {
//       throw new AuthenticationError('로그인이 필요합니다.');
//     }
    
//     // 인증된 사용자의 ID를 사용
//     const authenticatedOrderData = {
//       ...orderData,
//       userId: req.user.id
//     };
    
//     const result = await orderRequestService.createOrder(authenticatedOrderData);
    
//     res.status(201).json({
//       message: '구매 요청이 성공적으로 생성되었습니다.',
//       data: result
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const getOrderById: RequestHandler<{ orderId: string }> = async (req, res, next) => {
//   try {
//     const orderId = parseNumberOrThrow(req.params.orderId, 'orderId');
    
//     if (!req.user?.id) {
//       throw new AuthenticationError('로그인이 필요합니다.');
//     }
    
//     const result = await orderRequestService.getOrderById(orderId, req.user.id);
    
//     res.status(200).json({
//       message: '구매 요청 조회가 완료되었습니다.',
//       data: result
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const getOrdersByUserId: RequestHandler = async (req, res, next) => {
//   try {
//     if (!req.user?.id) {
//       throw new AuthenticationError('로그인이 필요합니다.');
//     }
    
//     const result = await orderRequestService.getOrdersByUserId(req.user.id);
    
//     res.status(200).json({
//       message: '내 구매 요청 리스트 조회가 완료되었습니다.',
//       data: result
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const cancelOrder: RequestHandler<{ orderId: string }, {}, TUpdateOrderStatusDto> = async (req, res, next) => {
//   try {
//     const orderId = parseNumberOrThrow(req.params.orderId, 'orderId');
    
//     if (!req.user?.id) {
//       throw new AuthenticationError('로그인이 필요합니다.');
//     }
    
//     const result = await orderRequestService.cancelOrder(orderId, req.user.id);
    
//     res.status(200).json({
//       message: '구매 요청이 성공적으로 취소되었습니다.',
//       data: result
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const createInstantOrder: RequestHandler<{}, {}, TCreateInstantOrderRequestDto> = async (req, res, next) => {
//   try {
//     const orderData: TCreateInstantOrderRequestDto = req.body;
    
//     if (!req.user?.id) {
//       throw new AuthenticationError('로그인이 필요합니다.');
//     }
    
//     // 인증된 사용자의 ID를 사용 (메시지 필드 제거)
//     const authenticatedOrderData = {
//       cartItemIds: orderData.cartItemIds,
//       userId: req.user.id
//     };
    
//     // 1. 주문 생성
//     const result = await orderRequestService.createInstantOrder(authenticatedOrderData);
    
//     // 2. orderService를 사용하여 승인 처리
//     const approvedOrder = await orderService.updateOrder(result.id, {
//       approver: req.user.name || '시스템',
//       adminMessage: '즉시 구매로 자동 승인',
//       status: 'APPROVED'
//     });
    
//     res.status(201).json({
//       message: '즉시 구매가 성공적으로 완료되었습니다.',
//       data: approvedOrder
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export default {
//   createOrder,
//   getOrderById,
//   getOrdersByUserId,
//   cancelOrder,
//   createInstantOrder
// };

// OrderRequest 관련 코드가 Order 모델로 통합되어 주석 처리됨
export default {}; 