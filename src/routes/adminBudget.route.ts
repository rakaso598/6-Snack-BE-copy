import { Router } from "express";
import budgetController from "../controllers/budget.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";

const adminBudgetRouter = Router({ mergeParams: true });

adminBudgetRouter.get("/", authenticateToken, authorizeRoles("SUPER_ADMIN"), budgetController.getMonthlyBudget);

export default adminBudgetRouter;
