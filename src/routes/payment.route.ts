import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import paymentController from "../controllers/payment.controller";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import { invalidateCache } from "../middlewares/cacheMiddleware";

const paymentRouter = Router();

paymentRouter.post(
  "/confirm",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  invalidateCache(["/products", "/orders", "/cartItems", "/my/orders"]),
  paymentController.confirmPayment,
);

paymentRouter.patch(
  "/cancel",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  invalidateCache(["/products", "/orders", "/cartItems", "/my/orders"]),
  paymentController.cancelPayment,
);

export default paymentRouter;
