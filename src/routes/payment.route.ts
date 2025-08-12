import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import paymentController from "../controllers/payment.controller";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import { invalidateCache } from "../middlewares/cacheMiddleware";

const paymentRouter = Router();

paymentRouter.post(
  "/confirm",
  authenticateToken,
  invalidateCache(),
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  paymentController.confirmPayment,
);

paymentRouter.delete(
  "/cancel",
  authenticateToken,
  invalidateCache(),
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  paymentController.cancelPayment,
);

export default paymentRouter;
