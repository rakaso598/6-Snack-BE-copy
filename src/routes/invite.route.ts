import { Router } from "express";
import inviteController from "../controllers/invite.controller";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import authenticateToken from "../middlewares/jwtAuth.middleware";

const inviteRouter = Router();

inviteRouter.post(
  "/",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN"),
  inviteController.createInvite
);

inviteRouter.get("/:inviteId", inviteController.getInviteInfo);
export default inviteRouter;
