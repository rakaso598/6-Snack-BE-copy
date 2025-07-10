import { Router } from "express";
import orderController from "../controllers/order.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import validateUpdateStatusOrderBody from "../middlewares/validateUpdateStatusOrderBody.middleware";

const adminOrderRouter = Router();

// 승인된 전체 구매내역 조회
adminOrderRouter.get("/", authenticateToken, authorizeRoles("ADMIN", "SUPER_ADMIN"), orderController.getApprovedOrders);

// 승인된 구매내역 상세 조회
adminOrderRouter.get(
  "/:orderId",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  orderController.getApprovedOrder,
);

// 구매 승인 | 구매 반려
adminOrderRouter.patch(
  "/:orderId",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  validateUpdateStatusOrderBody,
  orderController.updateOrder,
);

export default adminOrderRouter;
