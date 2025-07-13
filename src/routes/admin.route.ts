import { Router } from "express";
import adminOrderRouter from "./adminOrder.route";
import adminBudgetRouter from "./adminBudget.route";
import orderRequestController from "../controllers/orderRequest.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";

const adminRouter = Router();

adminRouter.use("/orders", adminOrderRouter);
adminRouter.use("/:companyId/budgets", adminBudgetRouter);

// 즉시 구매 (어드민 전용)
adminRouter.post("/orders/instant", authenticateToken, authorizeRoles("ADMIN", "SUPER_ADMIN"), orderRequestController.createInstantOrder);

export default adminRouter;
