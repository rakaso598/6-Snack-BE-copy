import { Router } from "express";
import orderController from "../controllers/order.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import validateUpdateStatusOrderBody from "../middlewares/validateUpdateStatusOrderBody.middleware";
import validateGetOrderQuery from "../middlewares/validateGetOrderQuery.middleware";

const adminOrderRouter = Router();

// 구매내역 조회(대기 or 승인)
adminOrderRouter.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  validateGetOrderQuery,
  orderController.getOrders,
);

// 구매내역 상세 조회(대기 or 승인)
adminOrderRouter.get(
  "/:orderId",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  validateGetOrderQuery,
  orderController.getOrder,
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
