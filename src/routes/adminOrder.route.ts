import { Router } from "express";
import orderController from "../controllers/order.controller";

const adminOrderRouter = Router();

// 승인된 전체 구매내역 조회
adminOrderRouter.get("/", orderController.getApprovedOrders);

// 승인된 구매내역 상세 조회
adminOrderRouter.get("/:orderId", orderController.getApprovedOrder);

export default adminOrderRouter;
