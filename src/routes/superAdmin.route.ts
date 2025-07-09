import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import userController from "../controllers/user.controller";

const superAdminRouter = Router();

superAdminRouter.delete("/users/:userId", authenticateToken, authorizeRoles("SUPER_ADMIN"), userController.deleteUser);
superAdminRouter.patch(
  "/users/:userId/role",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN"),
  userController.updateRole,
);

export default superAdminRouter;
