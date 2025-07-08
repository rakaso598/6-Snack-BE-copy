import { Router } from "express";
import orderController from "../controllers/order.controller";

const adminRouter = Router();

// 승인된 전체 구매내역 조회
adminRouter.get("/orders", orderController.getApprovedOrders);

// 승인된 구매내역 상세 조회
adminRouter.get("/orders/:orderId", orderController.getApprovedOrder);

export default adminRouter;
