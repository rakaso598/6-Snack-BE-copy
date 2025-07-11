import { Router } from "express";
import budgetController from "../controllers/budget.controller";
import validateBudgetBody from "../middlewares/validateBudgetBody.middleware";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";

const superAdminBudgetRouter = Router({ mergeParams: true });

superAdminBudgetRouter.patch(
  "/",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN"),
  validateBudgetBody,
  budgetController.updateMonthlyBudget,
);

export default superAdminBudgetRouter;
