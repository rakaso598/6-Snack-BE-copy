import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import paymentController from "../controllers/payment.controller";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";

const paymentRouter = Router();

paymentRouter.post(
  "/confirm",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  paymentController.confirmPayment,
);

export default paymentRouter;
