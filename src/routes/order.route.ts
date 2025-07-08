import { Router } from 'express';
import orderController from '../controllers/order.controller';

const router = Router();

// 구매 요청 생성
router.post('/', orderController.createOrder);

// 내 구매 요청 리스트
router.get('/', orderController.getOrdersByUserId);

// 구매 요청 상세 조회
router.get('/:orderId', orderController.getOrderById);

// 구매 요청 취소
router.patch('/:orderId', orderController.cancelOrder);

// 즉시 구매
router.post('/instant', orderController.createInstantOrder);

export default router; 