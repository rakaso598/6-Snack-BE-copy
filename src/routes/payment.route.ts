import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import paymentController from "../controllers/payment.controller";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import orderRepository from "../repositories/order.repository";
import cartRepository from "../repositories/cart.repository";

const paymentRouter = Router();

paymentRouter.post(
  "/confirm",
  authenticateToken,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  paymentController.confirmPayment,
);

paymentRouter.get("/test", async (req, res, next) => {
  const userId = "user-1";
  const { orderId } = req.body;
  // const order = await orderRepository.getOrderWithCartItemIdsById(orderId);

  // const cartItem = await cartRepository.revertCartItem(userId, productIds);
  const d = await orderRepository.deleteReceiptAndOrder(orderId);

  res.status(204).json(d);
});

export default paymentRouter;
