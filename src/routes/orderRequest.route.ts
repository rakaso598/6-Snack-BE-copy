import { Router } from 'express';
import orderRequestController from '../controllers/orderRequest.controller';

const router = Router();

// 구매 요청 생성
router.post('/', orderRequestController.createOrder);

// 내 구매 요청 리스트
router.get('/', orderRequestController.getOrdersByUserId);

// 구매 요청 상세 조회
router.get('/:orderId', orderRequestController.getOrderById);

// 구매 요청 취소
router.patch('/:orderId', orderRequestController.cancelOrder);

// 즉시 구매
router.post('/instant', orderRequestController.createInstantOrder);

export default router; 