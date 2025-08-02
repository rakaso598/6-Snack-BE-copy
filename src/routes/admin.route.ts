import { Router } from "express";
import adminOrderRouter from "./adminOrder.route";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import productController from "../controllers/product.controller";
import budgetController from "../controllers/budget.controller";

const adminRouter = Router();

adminRouter.use("/orders", adminOrderRouter);
adminRouter.get(
  "/:companyId/budgets",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  budgetController.getMonthlyBudget,
);
adminRouter.delete(
  "/products/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  productController.forceDeleteProduct,
);
adminRouter.patch(
  "/products/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  productController.forceUpdateProduct,
);

export default adminRouter;
