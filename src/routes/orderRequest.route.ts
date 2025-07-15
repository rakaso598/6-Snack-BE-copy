// import { Router } from 'express';
// import orderRequestController from '../controllers/orderRequest.controller';
// import authenticateToken from '../middlewares/jwtAuth.middleware';

// const router = Router();

// // 구매 요청 생성
// router.post('/', authenticateToken, orderRequestController.createOrder);

// // 내 구매 요청 리스트
// router.get('/', authenticateToken, orderRequestController.getOrdersByUserId);

// // 구매 요청 상세 조회
// router.get('/:orderId', authenticateToken, orderRequestController.getOrderById);

// // 구매 요청 취소
// router.patch('/:orderId', authenticateToken, orderRequestController.cancelOrder);

// // 즉시 구매 (어드민 전용)
// router.post('/instant', authenticateToken, orderRequestController.createInstantOrder);

// export default router;

// OrderRequest 관련 라우트가 Order 모델로 통합되어 주석 처리됨
import { Router } from 'express';
const router = Router();
export default router; 