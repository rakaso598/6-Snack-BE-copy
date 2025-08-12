import { Router } from "express";
import inviteController from "../controllers/invite.controller";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import { cacheMiddleware, invalidateCache } from '../middlewares/cacheMiddleware';

const inviteRouter = Router();

inviteRouter.post(
  "/",
  invalidateCache(),
  authenticateToken,
  authorizeRoles("SUPER_ADMIN"),
  inviteController.createInvite
);

inviteRouter.get("/:inviteId", cacheMiddleware(), inviteController.getInviteInfo);
export default inviteRouter;
