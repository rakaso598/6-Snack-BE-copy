import { Router } from "express";
import budgetController from "../controllers/budget.controller";
import validatedBudgetBody from "../middlewares/validatedBudgetBody.middleware";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";

const superAdminBudgetRouter = Router({ mergeParams: true });

superAdminBudgetRouter.patch(
  "/",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN"),
  validatedBudgetBody,
  budgetController.updateMonthlyBudget,
);

export default superAdminBudgetRouter;
