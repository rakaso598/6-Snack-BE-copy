import { Router } from "express";
import adminOrderRouter from "./adminOrder.route";
import adminBudgetRouter from "./adminBudget.route";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import productController from "../controllers/product.controller";

const adminRouter = Router();

adminRouter.use("/orders", adminOrderRouter);
adminRouter.use("/:companyId/budgets", adminBudgetRouter);
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
