import { Router } from "express";
import orderController from "../controllers/order.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import { cacheMiddleware, invalidateCache } from "../middlewares/cacheMiddleware";

const router = Router();

// 구매 요청 생성
router.post("/",invalidateCache() ,authenticateToken, orderController.createOrder);

// 내 구매 요청 리스트
router.get("/", cacheMiddleware(), authenticateToken, orderController.getOrdersByUserId);

// 구매 요청 상세 조회
router.get("/:orderId", cacheMiddleware(), authenticateToken, orderController.getOrderById);

// 구매 요청 취소
router.patch("/:orderId", invalidateCache(), authenticateToken, orderController.cancelOrder);

export default router;
