import { Router } from "express";
import adminOrderRouter from "./adminOrder.route";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import productController from "../controllers/product.controller";
import budgetController from "../controllers/budget.controller";
import { cacheMiddleware, invalidateCache } from "../middlewares/cacheMiddleware";

const adminRouter = Router();

adminRouter.use("/orders", adminOrderRouter);
adminRouter.get(
  "/:companyId/budgets",
  cacheMiddleware(),
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  budgetController.getMonthlyBudget,
);
adminRouter.delete(
  "/products/:id",
  invalidateCache(),
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  productController.forceDeleteProduct,
);
adminRouter.patch(
  "/products/:id",
  invalidateCache(),
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  productController.forceUpdateProduct,
);

export default adminRouter;
