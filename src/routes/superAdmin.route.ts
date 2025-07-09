import { Router } from "express";
import authenticateToken from "../middlewares/auth.middleware";
import authorizeRoles from "../middlewares/authorization.middleware";

const superAdminRouter = Router();

superAdminRouter.delete('/users/:userId',authenticateToken, authorizeRoles('SUPER_ADMIN'), )

export default superAdminRouter;
