import { Router } from "express";
import orderController from "../controllers/order.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import validateUpdateStatusOrderBody from "../middlewares/validateUpdateStatusOrderBody.middleware";
import validateGetOrderQuery from "../middlewares/validateGetOrderQuery.middleware";
import { cacheMiddleware, invalidateCache } from "../middlewares/cacheMiddleware";

const adminOrderRouter = Router();

// 구매내역 조회(대기 or 승인)
adminOrderRouter.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  validateGetOrderQuery,
  cacheMiddleware("/orders"),
  orderController.getOrders,
);

// 구매내역 상세 조회(대기 or 승인)
adminOrderRouter.get(
  "/:orderId",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  cacheMiddleware("/orders/:orderId"),
  orderController.getOrder,
);

// 구매 승인 | 구매 반려
adminOrderRouter.patch(
  "/:orderId",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  validateUpdateStatusOrderBody,
  invalidateCache(["/orders", "/orders/:orderId"]),
  orderController.updateOrder,
);

// 즉시 구매 (어드민 전용)
adminOrderRouter.post(
  "/instant",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  invalidateCache(["/orders", "/orders/:orderId"]),
  orderController.createInstantOrder,
);

export default adminOrderRouter;
