import { Router } from "express";
import superAdminBudgetRouter from "./superAdminBudget.route";

const superAdminRouter = Router();

superAdminRouter.use("/:companyId/budgets", superAdminBudgetRouter);

export default superAdminRouter;
