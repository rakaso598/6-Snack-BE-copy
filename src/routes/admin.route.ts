import { Router } from "express";
import adminOrderRouter from "./adminOrder.route";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import productController from "../controllers/product.controller";
import budgetController from "../controllers/budget.controller";
import { invalidateCache } from "../middlewares/cacheMiddleware";

const adminRouter = Router();

adminRouter.use("/orders", adminOrderRouter);

// 예산 조회
adminRouter.get(
  "/:companyId/budgets",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  budgetController.getMonthlyBudget,
);

// 상품 삭제
adminRouter.delete(
  "/products/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  productController.forceDeleteProduct,
);

// 상품 수정
adminRouter.patch(
  "/products/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  productController.forceUpdateProduct,
);

export default adminRouter;
