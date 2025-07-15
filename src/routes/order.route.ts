import { Router } from 'express';
import orderController from '../controllers/order.controller';
import authenticateToken from '../middlewares/jwtAuth.middleware';

const router = Router();

// 구매 요청 생성
router.post('/', authenticateToken, orderController.createOrder);

// 내 구매 요청 리스트
router.get('/', authenticateToken, orderController.getOrdersByUserId);

// 구매 요청 상세 조회
router.get('/:orderId', authenticateToken, orderController.getOrderById);

// 구매 요청 취소
router.patch('/:orderId', authenticateToken, orderController.cancelOrder);

// 즉시 구매 (어드민 전용)
router.post('/instant', authenticateToken, orderController.createInstantOrder);

export default router; 