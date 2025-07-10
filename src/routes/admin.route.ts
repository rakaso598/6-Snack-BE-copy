import { Router } from "express";
import adminOrderRouter from "./adminOrder.route";
import adminBudgetRouter from "./adminBudget.route";

const adminRouter = Router();

adminRouter.use("/orders", adminOrderRouter);
adminRouter.use("/:companyId/budgets", adminBudgetRouter);

export default adminRouter;
